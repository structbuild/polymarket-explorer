import type { Metadata } from "next";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { MARKET_SKELETON_COLUMNS } from "@/components/market/markets-table-columns";
import { MarketsStatusListing } from "@/components/market/market-status-listing";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { marketResponseToRow } from "@/lib/market-table-map";
import { getSiteUrl } from "@/lib/env";
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { getTopMarkets } from "@/lib/struct/market-queries";
import { loadMarketSearchParams } from "@/lib/market-search-params.server";

export const metadata: Metadata = buildPageMetadata({
	title: "Top Polymarket Markets · Live Odds & 24h Volume",
	description:
		"Every active Polymarket market, sorted by 24h volume. Track live probabilities, liquidity, and trader activity in real time.",
	canonical: "/markets",
});

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function MarketsPage({ searchParams }: Props) {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Suspense fallback={<MarketsPageFallback />}>
				<MarketsPageContent searchParams={searchParams} />
			</Suspense>
		</div>
	);
}

async function MarketsPageContent({ searchParams }: Props) {
	const { sort_by, sort_dir, timeframe, tab, cursor } = await loadMarketSearchParams(searchParams);
	const activeCursor = cursor || undefined;
	const { data: markets, hasMore, nextCursor } = await getTopMarkets(24, tab, activeCursor, sort_by, sort_dir, timeframe);
	const siteUrl = getSiteUrl();

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `Markets — ${SITE_NAME}`,
		description: `Browse active prediction markets sorted by volume on ${SITE_NAME}.`,
		url: new URL("/markets", siteUrl).toString(),
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: markets.length,
			itemListElement: markets.map((market, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: market.question ?? "Untitled Market",
				url: market.market_slug
					? new URL(`/markets/${market.market_slug}`, siteUrl).toString()
					: undefined,
			})),
		},
	};

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Markets", href: "/markets" },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6 space-y-4">
				<div>
					<h1 className="text-xl font-medium tracking-tight">Markets</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Browse prediction markets.
					</p>
				</div>
				<MarketsStatusListing
					initialMarkets={markets.map(marketResponseToRow)}
					initialTab={tab}
					initialCursor={activeCursor ?? null}
					initialHasMore={hasMore}
					initialNextCursor={nextCursor}
					sortBy={sort_by}
					sortDirection={sort_dir}
					timeframe={timeframe}
				/>
			</div>
		</>
	);
}

function MarketsPageFallback() {
	return (
		<>
			<Skeleton className="h-5 w-32" />
			<div className="mt-6 space-y-4">
				<div>
					<Skeleton className="h-7 w-28" />
					<Skeleton className="mt-1 h-5 w-52" />
				</div>
				<DataTableSkeleton
					columns={MARKET_SKELETON_COLUMNS}
					rowCount={24}
					toolbarLeft={
						<div className="flex items-end gap-5">
							<Skeleton className="h-7 w-14" />
							<Skeleton className="h-7 w-20" />
						</div>
					}
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
