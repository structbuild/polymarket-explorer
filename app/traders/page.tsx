import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/seo/pagination-nav";
import { TradersCategoryTabs } from "@/components/trader/traders-category-tabs";
import { TradersTable } from "@/components/trader/traders-table";
import { TRADER_SKELETON_COLUMNS } from "@/components/trader/traders-table-columns";
import { TradersTimeframeToggle } from "@/components/trader/traders-timeframe-toggle";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { getSiteUrl } from "@/lib/env";
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { getCategoryLeaderboard, getGlobalLeaderboard } from "@/lib/struct/market-queries";
import { parsePolymarketCategory } from "@/lib/tag-category";
import {
	DEFAULT_TRADER_LEADERBOARD_SORT,
	DEFAULT_TRADER_LEADERBOARD_SORT_DIRECTION,
	getLeaderboardSortLabel,
	parseTraderLeaderboardSort,
	parseTraderLeaderboardSortDirection,
	resolveLeaderboardSortField,
} from "@/lib/trader-leaderboard-sort";
import { parseTraderTimeframe } from "@/lib/trader-timeframes";
import { getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = buildPageMetadata({
	title: "Top Polymarket Traders by PnL · Live Leaderboard",
	description:
		"Live Polymarket trader leaderboard — ranked by realized PnL, volume, markets traded, and win rate. See who's winning today.",
	canonical: "/traders",
});

export default function TradersPage({ searchParams }: Props) {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Suspense fallback={<TradersPageFallback />}>
				<TradersPageContent searchParams={searchParams} />
			</Suspense>
		</div>
	);
}

async function TradersPageContent({ searchParams }: Props) {
	await connection();

	const resolvedSearchParams = await searchParams;
	const timeframe = parseTraderTimeframe(resolvedSearchParams.timeframe);
	const category = parsePolymarketCategory(resolvedSearchParams.category);
	const scope = category ? "category" : "global";
	const sort = parseTraderLeaderboardSort(resolvedSearchParams.sort, scope);
	const direction = parseTraderLeaderboardSortDirection(resolvedSearchParams.dir);
	const cursor = typeof resolvedSearchParams.cursor === "string" ? resolvedSearchParams.cursor : undefined;
	const pageParam = typeof resolvedSearchParams.page === "string" ? Number.parseInt(resolvedSearchParams.page, 10) : 1;
	const page = Number.isSafeInteger(pageParam) && pageParam >= 1 ? pageParam : 1;
	const pageSize = 25;
	const sortOptions = { sortBy: resolveLeaderboardSortField(sort, scope), sortDirection: direction };
	const { data: traders, hasMore, nextCursor } = category
		? await getCategoryLeaderboard(category, timeframe, pageSize, cursor, sortOptions)
		: await getGlobalLeaderboard(timeframe, pageSize, cursor, sortOptions);
	const siteUrl = getSiteUrl();

	const sortLabel = getLeaderboardSortLabel(sort);
	const orderLabel = direction === "asc" ? "lowest" : "highest";

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: `Traders — ${SITE_NAME}`,
		description: `Top Polymarket traders ranked by ${sortLabel} on ${SITE_NAME}.`,
		url: new URL("/traders", siteUrl).toString(),
		numberOfItems: traders.length,
		itemListElement: traders.map((entry, index) => ({
			"@type": "ListItem",
			position: (page - 1) * pageSize + index + 1,
			name: getTraderDisplayName(entry.trader),
			url: new URL(
				`/traders/${normalizeWalletAddress(entry.trader.address) ?? entry.trader.address}`,
				siteUrl,
			).toString(),
		})),
	};

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Traders", href: "/traders" },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6">
				<div className="mb-6">
					<h1 className="text-xl font-medium tracking-tight">Traders</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{category
							? `${category} traders with the ${orderLabel} ${sortLabel}.`
							: `Polymarket traders with the ${orderLabel} ${sortLabel}.`}
					</p>
				</div>
				<TradersTable
					traders={traders}
					rankOffset={(page - 1) * pageSize}
					scope={scope}
					sort={sort}
					direction={direction}
					toolbarLeft={<TradersCategoryTabs category={category} />}
					toolbarRight={<TradersTimeframeToggle timeframe={timeframe} />}
				/>
			</div>
			<PaginationNav
				basePath="/traders"
				baseParams={{
					...(timeframe ? { timeframe } : {}),
					...(category ? { category } : {}),
					...(sort !== DEFAULT_TRADER_LEADERBOARD_SORT ? { sort } : {}),
					...(direction !== DEFAULT_TRADER_LEADERBOARD_SORT_DIRECTION ? { dir: direction } : {}),
				}}
				page={page}
				cursor={cursor ?? null}
				nextCursor={nextCursor}
				hasMore={hasMore}
			/>
		</>
	);
}

function TradersPageFallback() {
	return (
		<>
			<Skeleton className="h-5 w-32" />
			<div className="mt-6">
				<div className="mb-3">
					<Skeleton className="h-7 w-24" />
					<Skeleton className="mt-1 h-5 w-72" />
				</div>
				<DataTableSkeleton
					columns={TRADER_SKELETON_COLUMNS}
					rowCount={25}
					toolbarLeft={<Skeleton className="h-8 w-full max-w-md" />}
					toolbarRight={<Skeleton className="h-8 w-52" />}
				/>
			</div>
			<nav
				aria-hidden="true"
				className="mt-8 flex items-center justify-center gap-3"
			>
				<Skeleton className="h-10 w-28" />
				<Skeleton className="h-10 w-28" />
			</nav>
		</>
	);
}
