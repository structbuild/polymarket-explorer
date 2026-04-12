import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/seo/pagination-nav";
import { TradersTable } from "@/components/trader/traders-table";
import { TradersTimeframeToggle } from "@/components/trader/traders-timeframe-toggle";
import { getSiteUrl } from "@/lib/env";
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { getGlobalLeaderboard } from "@/lib/struct/market-queries";
import { parseTraderTimeframe } from "@/lib/trader-timeframes";
import { getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";

export const revalidate = 300;

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = buildPageMetadata({
	title: "Top Polymarket Traders",
	description: "Compare top Polymarket traders by PnL, volume, markets traded, and win rate.",
	canonical: "/traders",
});

export default async function TradersPage({ searchParams }: Props) {
	const resolvedSearchParams = await searchParams;
	const timeframe = parseTraderTimeframe(resolvedSearchParams.timeframe);
	const cursor = typeof resolvedSearchParams.cursor === "string" ? resolvedSearchParams.cursor : undefined;
	const { data: traders, hasMore, nextCursor } = await getGlobalLeaderboard(timeframe, 100, cursor);
	const siteUrl = getSiteUrl();

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: `Traders — ${SITE_NAME}`,
		description: `Top Polymarket traders ranked by realized profit on ${SITE_NAME}.`,
		url: new URL("/traders", siteUrl).toString(),
		numberOfItems: traders.length,
		itemListElement: traders.map((entry, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: getTraderDisplayName(entry.trader),
			url: new URL(
				`/trader/${normalizeWalletAddress(entry.trader.address) ?? entry.trader.address}`,
				siteUrl,
			).toString(),
		})),
	};

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Traders", href: "/traders" },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6">
				<TradersTable
					traders={traders}
					toolbarLeft={
						<div className="mb-3">
							<h1 className="text-xl font-medium tracking-tight">Traders</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								Top Polymarket traders ranked by realized profit.
							</p>
						</div>
					}
					toolbarRight={<TradersTimeframeToggle timeframe={timeframe} />}
				/>
			</div>
			<PaginationNav
				basePath="/traders"
				baseParams={{ timeframe }}
				cursor={cursor ?? null}
				nextCursor={nextCursor}
				hasMore={hasMore}
			/>
		</div>
	);
}
