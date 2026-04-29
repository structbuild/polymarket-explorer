import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import type { Tag } from "@structbuild/sdk";

import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { TagBuildersSection } from "@/components/builders/tag-builders-section";
import { TagMarketsStatusListing } from "@/components/market/market-status-listing";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { TagStatsRow } from "@/components/tags/tag-stats-row";
import { marketResponseToRow } from "@/lib/market-table-map";
import { getSiteUrl } from "@/lib/env";
import { formatCapitalizeWords, formatNumber } from "@/lib/format";
import {
	buildEntityPageTitle,
	buildPageMetadata,
	SITE_NAME,
} from "@/lib/site-metadata";
import {
	getTagAnalyticsChanges,
	getTagAnalyticsDeltas,
	getTagAnalyticsTimeseries,
} from "@/lib/struct/analytics-queries";
import { DEFAULT_ANALYTICS_VIEW, parseAnalyticsParams } from "@/lib/struct/analytics-shared";
import { parseMarketStatusTab } from "@/lib/market-search-params-shared";
import { getTagBySlug, getMarketsByTag } from "@/lib/struct/market-queries";

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function TagHeader({ tag, tagDisplay }: { tag: Tag; tagDisplay: string }) {
	return (
		<div>
			<h1 className="text-xl font-medium tracking-tight">{tagDisplay} Markets</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Explore prediction markets related to tag: {tagDisplay}.
			</p>
			<TagStatsRow tag={tag} className="mt-2" />
		</div>
	);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const tag = await getTagBySlug(slug);

	if (!tag) {
		return {};
	}

	const canonicalSlug = tag.slug ?? slug;
	const tagTitle = formatCapitalizeWords(tag.label);

	const volume = tag.volume_usd > 0 ? formatNumber(tag.volume_usd, { compact: true, currency: true }) : null;
	const traders = tag.unique_traders > 0 ? formatNumber(tag.unique_traders, { decimals: 0 }) : null;
	const isEmpty = tag.volume_usd === 0 && tag.txn_count === 0 && tag.unique_traders === 0;

	const stats: string[] = [];
	if (volume) stats.push(`${volume} volume`);
	if (traders) stats.push(`${traders} traders`);
	const descriptionStats = stats.length ? `${stats.join(", ")}. ` : "";

	return buildPageMetadata({
		title: buildEntityPageTitle(tagTitle, "Polymarket Markets"),
		description: `Polymarket ${tagTitle} prediction markets. ${descriptionStats}Live odds, trading volume, and recent market activity.`,
		canonical: `/tags/${canonicalSlug}`,
		...(isEmpty && { robots: { index: false, follow: true } }),
	});
}

export default function TagPage({ params, searchParams }: Props) {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Suspense fallback={<TagPageFallback />}>
				<TagPageContent params={params} searchParams={searchParams} />
			</Suspense>
		</div>
	);
}

async function TagPageContent({
	params,
	searchParams,
}: {
	params: Props["params"];
	searchParams: Props["searchParams"];
}) {
	await connection();

	const { slug } = await params;
	const tag = await getTagBySlug(slug);

	if (!tag) {
		notFound();
	}

	const resolvedSearchParams = await searchParams;
	const cursor = typeof resolvedSearchParams.cursor === "string" ? resolvedSearchParams.cursor : undefined;
	const { view, range, resolution, defaultResolution, defaultRange } = parseAnalyticsParams(resolvedSearchParams, "scoped", "30d");
	const marketTab = parseMarketStatusTab(resolvedSearchParams.tab);
	const canonicalSlug = tag.slug ?? slug;
	const tagKey = tag.slug ?? tag.label;
	const { data: markets, hasMore, nextCursor } = await getMarketsByTag(tag.label, 24, cursor, "volume", "desc", marketTab);
	const paginationBaseParams: Record<string, string> = {
		...(view !== DEFAULT_ANALYTICS_VIEW ? { view } : {}),
		...(range !== defaultRange ? { range } : {}),
		...(resolution !== defaultResolution ? { resolution } : {}),
	};
	const siteUrl = getSiteUrl();
	const tagDisplay = formatCapitalizeWords(tag.label);

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${tagDisplay} — ${SITE_NAME}`,
		description: `Prediction markets tagged ${tagDisplay} on ${SITE_NAME}.`,
		url: new URL(`/tags/${canonicalSlug}`, siteUrl).toString(),
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
					{ label: "Tags", href: "/tags" },
					{ label: tagDisplay, href: `/tags/${canonicalSlug}` },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6 space-y-4">
				<TagHeader tag={tag} tagDisplay={tagDisplay} />
				<TagMarketsStatusListing
					basePath={`/tags/${canonicalSlug}`}
					baseParams={paginationBaseParams}
					tagLabel={tag.label}
					initialMarkets={markets.map(marketResponseToRow)}
					initialTab={marketTab}
					initialCursor={cursor ?? null}
					initialHasMore={hasMore}
					initialNextCursor={nextCursor}
				/>
			</div>

			<div className="mt-8">
				<AnalyticsSection
					title="Analytics"
					range={range}
					view={view}
					resolution={resolution}
					defaultResolution={defaultResolution}
					defaultRange={defaultRange}
					pathname={`/tags/${canonicalSlug}`}
					fetchers={{
						deltas: () => getTagAnalyticsDeltas(tagKey, range, resolution),
						timeseries: () => getTagAnalyticsTimeseries(tagKey, range, resolution),
						changes: () => getTagAnalyticsChanges(tagKey, range),
					}}
				/>
			</div>

			<div className="mt-8">
				<Suspense fallback={null}>
					<TagBuildersSection tagLabel={tag.label} />
				</Suspense>
			</div>
		</>
	);
}

function TagPageFallback() {
	return (
		<div className="mt-6 space-y-4">
			<div>
				<div className="h-7 w-32 animate-pulse rounded bg-muted" />
				<div className="mt-2 h-4 w-52 animate-pulse rounded bg-muted" />
			</div>
			<div className="h-64 rounded-lg bg-card" />
		</div>
	);
}
