import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/seo/pagination-nav";
import { MarketCard } from "@/components/market/market-card";
import { getSiteUrl } from "@/lib/env";
import { getTopMarkets } from "@/lib/struct/market-queries";

export const revalidate = 300;

export const metadata: Metadata = {
	title: "All Prediction Markets - Browse Polymarket Odds",
	description:
		"Browse all active prediction markets on Polymarket. Real-time probabilities, trading volume, and liquidity data.",
	alternates: {
		canonical: "/markets",
	},
};

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketsPage({ searchParams }: Props) {
	const resolvedSearchParams = await searchParams;
	const cursor = typeof resolvedSearchParams.cursor === "string" ? resolvedSearchParams.cursor : undefined;
	const { data: markets, hasMore, nextCursor } = await getTopMarkets(24, "open", cursor);
	const siteUrl = getSiteUrl();

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: "All Prediction Markets",
		description: "Browse active prediction markets sorted by volume.",
		url: new URL("/markets", siteUrl).toString(),
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: markets.length,
			itemListElement: markets.map((market, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: market.question ?? "Untitled Market",
				url: market.market_slug
					? new URL(`/market/${market.market_slug}`, siteUrl).toString()
					: undefined,
			})),
		},
	};

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Markets", href: "/markets" },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6">
				<h1 className="text-xl font-medium tracking-tight">Markets</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Browse active prediction markets sorted by volume.
				</p>
			</div>

			<div className="mt-8 grid gap-4 sm:grid-cols-2">
				{markets.map((market) => (
					<MarketCard
						key={market.condition_id}
						slug={market.market_slug ?? null}
						question={market.question ?? null}
						imageUrl={market.image_url ?? null}
						outcomes={
							market.outcomes?.map((o) => ({
								label: o.name,
								probability: o.price,
							})) ?? []
						}
						volumeUsd={market.volume_usd ?? null}
						liquidityUsd={market.liquidity_usd ?? null}
						status={market.status}
						endTime={market.end_time ?? null}
					/>
				))}
			</div>
			<PaginationNav
				basePath="/markets"
				cursor={cursor ?? null}
				nextCursor={nextCursor}
				hasMore={hasMore}
			/>
		</div>
	);
}
