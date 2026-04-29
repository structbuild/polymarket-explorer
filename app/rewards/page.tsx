import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { REWARDS_SKELETON_COLUMNS } from "@/components/rewards/rewards-table-columns";
import { RewardsRefreshButton } from "@/components/rewards/rewards-refresh-button";
import { RewardsTable } from "@/components/rewards/rewards-table";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { getSiteUrl } from "@/lib/env";
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { getRewardsMarkets } from "@/lib/struct/queries";

export const metadata: Metadata = buildPageMetadata({
	title: "Polymarket Liquidity Rewards · Live APR & Spreads",
	description:
		"Every Polymarket market with active liquidity rewards — reward rate, spread, and market depth. Find the best markets to market-make in.",
	canonical: "/rewards",
});

async function RewardsContent() {
	await connection();

	const markets = await getRewardsMarkets();
	const siteUrl = getSiteUrl().origin;

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `Liquidity Rewards — ${SITE_NAME}`,
		description: `Polymarket markets with active liquidity rewards on ${SITE_NAME}.`,
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: markets.length,
			itemListElement: markets.slice(0, 50).map((market, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: market.question ?? market.title ?? "Market",
				...(market.market_slug
					? { url: `${siteUrl}/markets/${market.market_slug}` }
					: {}),
			})),
		},
	};

	return (
		<>
			<JsonLd data={jsonLd} />
			<RewardsTable markets={markets} />
		</>
	);
}

function RewardsFallback() {
	return (
		<div role="status" aria-busy="true" aria-label="Loading reward markets">
			<span className="sr-only">Loading reward markets</span>
			<div aria-hidden="true">
				<DataTableSkeleton columns={REWARDS_SKELETON_COLUMNS} rowCount={25} />
			</div>
			<div
				aria-hidden="true"
				className="mt-3 flex items-center justify-between gap-4 px-1 text-sm text-muted-foreground"
			>
				<Skeleton className="h-4 w-24" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-7 w-20" />
					<Skeleton className="h-7 w-16" />
					<Skeleton className="size-8" />
					<Skeleton className="size-8" />
				</div>
			</div>
		</div>
	);
}

export default function RewardsPage() {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Rewards", href: "/rewards" },
				]}
			/>
			<div className="mt-6 mb-6 flex flex-col md:flex-row flex-wrap items-start md:items-end justify-between gap-x-4 gap-y-2">
				<div className="min-w-0 flex-1">
					<h1 className="text-xl font-medium tracking-tight">Markets with Rewards</h1>
					<p className="mt-1 text-sm text-muted-foreground">View markets with active reward programs by providing liquidity.</p>
				</div>
				<RewardsRefreshButton />
			</div>
			<Suspense fallback={<RewardsFallback />}>
				<RewardsContent />
			</Suspense>
		</div>
	);
}
