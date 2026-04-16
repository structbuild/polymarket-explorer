import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/seo/pagination-nav";
import { SortableMarketsTable } from "@/components/market/sortable-markets-table";
import { marketResponseToRow } from "@/lib/market-table-map";
import { getSiteUrl } from "@/lib/env";
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { getTopMarkets } from "@/lib/struct/market-queries";
import { loadMarketSearchParams } from "@/lib/market-search-params.server";

export const metadata: Metadata = buildPageMetadata({
	title: "Prediction Markets",
	description: "Browse active Polymarket prediction markets with live probabilities, volume, and liquidity data.",
	canonical: "/markets",
});

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketsPage({ searchParams }: Props) {
	const { sort_by, sort_dir, timeframe, cursor } = await loadMarketSearchParams(searchParams);
	const activeCursor = cursor || undefined;
	const { data: markets, hasMore, nextCursor } = await getTopMarkets(24, "open", activeCursor, sort_by, sort_dir, timeframe);
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

	const baseParams: Record<string, string> = {};
	if (sort_by !== "volume") baseParams.sort_by = sort_by;
	if (sort_dir !== "desc") baseParams.sort_dir = sort_dir;
	if (timeframe !== "24h") baseParams.timeframe = timeframe;

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
				<SortableMarketsTable
					markets={markets.map(marketResponseToRow)}
					paginationMode="none"
					sortBy={sort_by}
					sortDirection={sort_dir}
					timeframe={timeframe}
					toolbarLeft={
						<div className="mb-3">
							<h1 className="text-xl font-medium tracking-tight">Markets</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								Browse active prediction markets.
							</p>
						</div>
					}
				/>
			</div>
			<PaginationNav
				basePath="/markets"
				baseParams={baseParams}
				cursor={activeCursor ?? null}
				nextCursor={nextCursor}
				hasMore={hasMore}
			/>
		</div>
	);
}
