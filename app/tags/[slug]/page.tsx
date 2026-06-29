import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import type { Tag } from "@structbuild/sdk";

import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { TagBuildersSection } from "@/components/builders/tag-builders-section";
import { TagEventsStatusListing } from "@/components/event/tag-events-status-listing";
import { SectionAnchor } from "@/components/layout/section-anchor";
import type { SubheaderSlot } from "@/components/layout/section-subheader-bar";
import { TagMarketsStatusListing } from "@/components/market/market-status-listing";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { TagSectionSubheader } from "@/components/tags/tag-section-subheader";
import { TagStatsRow } from "@/components/tags/tag-stats-row";
import { TagTopTradersListing } from "@/components/tags/tag-top-traders-listing";
import { TagViewTabs } from "@/components/tags/tag-view-tabs";
import { TabTeaser } from "@/components/ui/tabs";
import { tagToCategory } from "@/lib/tag-category";
import { DEFAULT_TAG_VIEW, parseTagView, tagViewValues, viewLabels, type TagView } from "@/lib/tag-view-shared";
import { eventResponseToRow } from "@/lib/event-table-map";
import { marketResponseToRow } from "@/lib/market-table-map";
import { getSiteUrl } from "@/lib/env";
import { formatCapitalizeWords, formatNumber } from "@/lib/format";
import {
	buildEntityPageTitle,
	buildPageMetadata,
	SITE_NAME,
} from "@/lib/site-metadata";
import { DEFAULT_ANALYTICS_VIEW, parseAnalyticsParams, SCOPED_VOLUME_COMPONENTS } from "@/lib/struct/analytics-shared";
import { parseEventStatusTab } from "@/lib/event-search-params-shared";
import { parseMarketStatusTab } from "@/lib/market-search-params-shared";
import { getEventsByTag } from "@/lib/struct/queries/events";
import { getTagBySlug, getMarketsByTag } from "@/lib/struct/market-queries";
import {
	buildLeaderboardSearchParams,
	parseTraderLeaderboardSort,
	parseTraderLeaderboardSortDirection,
} from "@/lib/trader-leaderboard-sort";
import { parseTraderTimeframe } from "@/lib/trader-timeframes";

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function TagHeader({ tag, tagDisplay }: { tag: Tag; tagDisplay: string }) {
	return (
		<div>
			<h1 className="text-xl font-medium tracking-tight">{tagDisplay}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Explore prediction-market events and markets tagged {tagDisplay}.
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

	const volumeUsd = tag.volume_usd ?? 0;
	const uniqueTraders = tag.unique_traders ?? 0;
	const txnCount = tag.txn_count ?? 0;
	const volume = volumeUsd > 0 ? formatNumber(volumeUsd, { compact: true, currency: true }) : null;
	const traders = uniqueTraders > 0 ? formatNumber(uniqueTraders, { decimals: 0 }) : null;
	const isEmpty = volumeUsd === 0 && txnCount === 0 && uniqueTraders === 0;

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
		<Suspense fallback={<TagPageFallback />}>
			<TagPageContent params={params} searchParams={searchParams} />
		</Suspense>
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
	const {
		view: analyticsView,
		range,
		resolution,
		defaultResolution,
		defaultRange,
	} = parseAnalyticsParams(resolvedSearchParams, "scoped", "30d");
	const category = tagToCategory(tag);
	const availableViews: readonly TagView[] = category
		? tagViewValues
		: tagViewValues.filter((view) => view !== "top-traders");
	const tagView = parseTagView(resolvedSearchParams.content, availableViews);
	const marketTab = parseMarketStatusTab(resolvedSearchParams.tab);
	const eventTab = parseEventStatusTab(resolvedSearchParams.tab);
	const traderTimeframe = parseTraderTimeframe(resolvedSearchParams.timeframe);
	const traderSort = parseTraderLeaderboardSort(resolvedSearchParams.sort, "category");
	const traderDirection = parseTraderLeaderboardSortDirection(resolvedSearchParams.dir);
	const pageParam =
		typeof resolvedSearchParams.page === "string" ? Number.parseInt(resolvedSearchParams.page, 10) : 1;
	const page = Number.isSafeInteger(pageParam) && pageParam >= 1 ? pageParam : 1;
	const canonicalSlug = tag.slug ?? slug;
	const tagKey = tag.slug ?? tag.label;
	const [marketsResult, eventsResult] = await Promise.all([
		tagView === "markets"
			? getMarketsByTag(tag.label, 24, cursor, "volume", "desc", marketTab)
			: Promise.resolve({ data: [], hasMore: false, nextCursor: null }),
		tagView === "events"
			? getEventsByTag(canonicalSlug, 24, eventTab, cursor, "volume", "desc", "24h")
			: Promise.resolve({ data: [], hasMore: false, nextCursor: null }),
	]);
	const { data: markets, hasMore: marketsHasMore, nextCursor: marketsNextCursor } = marketsResult;
	const { data: events, hasMore: eventsHasMore, nextCursor: eventsNextCursor } = eventsResult;
	const paginationBaseParams: Record<string, string> = {
		...(analyticsView !== DEFAULT_ANALYTICS_VIEW ? { view: analyticsView } : {}),
		...(range !== defaultRange ? { range } : {}),
		...(resolution !== defaultResolution ? { resolution } : {}),
		...(tagView !== DEFAULT_TAG_VIEW ? { content: tagView } : {}),
	};
	const siteUrl = getSiteUrl();
	const tagDisplay = formatCapitalizeWords(tag.label);

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `${tagDisplay} — ${SITE_NAME}`,
		description: `Prediction markets tagged ${tagDisplay} on ${SITE_NAME}.`,
		url: new URL(`/tags/${canonicalSlug}`, siteUrl).toString(),
		mainEntity:
			tagView === "events"
				? {
					"@type": "ItemList",
					numberOfItems: events.length,
					itemListElement: events.map((event, index) => ({
						"@type": "ListItem",
						position: index + 1,
						name: event.title ?? "Untitled Event",
						url: event.event_slug
							? new URL(`/events/${event.event_slug}`, siteUrl).toString()
							: undefined,
					})),
				}
				: {
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

	const viewTabs = (
		<TagViewTabs
			value={tagView}
			availableViews={availableViews}
			teasers={
				(tag.unique_traders ?? 0) > 0
					? {
							"top-traders": (
								<TabTeaser>{formatNumber(tag.unique_traders, { compact: true })}</TabTeaser>
							),
						}
					: undefined
			}
		/>
	);

	const subheaderSlots: SubheaderSlot[] = [
		{ type: "anchor", id: "tag-overview", label: "Overview" },
		{
			type: "tabs",
			id: "tag-content",
			tabs: availableViews.map((view) => ({ value: view, label: viewLabels[view] })),
		},
		{ type: "anchor", id: "tag-analytics", label: "Analytics" },
		{ type: "anchor", id: "tag-builders", label: "Builders" },
	];

	return (
		<>
			<TagSectionSubheader slots={subheaderSlots} value={tagView} />
			<div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-8">
				<Breadcrumbs
					items={[
						{ label: "Home", href: "/" },
						{ label: "Tags", href: "/tags" },
						{ label: tagDisplay, href: `/tags/${canonicalSlug}` },
					]}
				/>
				<JsonLd data={jsonLd} />

				<SectionAnchor id="tag-overview" className="mt-6">
					<TagHeader tag={tag} tagDisplay={tagDisplay} />
				</SectionAnchor>

				<SectionAnchor id="tag-content" className="mt-4 space-y-4">
					{tagView !== "top-traders" && viewTabs}
					{tagView === "events" && (
						<TagEventsStatusListing
							basePath={`/tags/${canonicalSlug}`}
							baseParams={paginationBaseParams}
							tagSlug={canonicalSlug}
							initialEvents={events.map(eventResponseToRow)}
							initialTab={eventTab}
							initialCursor={cursor ?? null}
							initialHasMore={eventsHasMore}
							initialNextCursor={eventsNextCursor}
						/>
					)}
					{tagView === "markets" && (
						<TagMarketsStatusListing
							basePath={`/tags/${canonicalSlug}`}
							baseParams={paginationBaseParams}
							tagLabel={tag.label}
							initialMarkets={markets.map((market) => marketResponseToRow(market))}
							initialTab={marketTab}
							initialCursor={cursor ?? null}
							initialHasMore={marketsHasMore}
							initialNextCursor={marketsNextCursor}
						/>
					)}
					{tagView === "top-traders" && category && (
						<Suspense fallback={null}>
							<TagTopTradersListing
								category={category}
								timeframe={traderTimeframe}
								sort={traderSort}
								direction={traderDirection}
								cursor={cursor ?? null}
								page={page}
								basePath={`/tags/${canonicalSlug}`}
								baseParams={{
									...paginationBaseParams,
									content: "top-traders",
									...buildLeaderboardSearchParams({
										timeframe: traderTimeframe,
										sort: traderSort,
										direction: traderDirection,
									}),
								}}
								toolbarLeft={viewTabs}
							/>
						</Suspense>
					)}
				</SectionAnchor>

				<SectionAnchor id="tag-analytics" className="mt-8">
					<AnalyticsSection
						title="Analytics"
						range={range}
						view={analyticsView}
						resolution={resolution}
						defaultResolution={defaultResolution}
						defaultRange={defaultRange}
							allowedComponents={SCOPED_VOLUME_COMPONENTS}
							pathname={`/tags/${canonicalSlug}`}
							source={{ kind: "tag", tag: tagKey }}
						/>
				</SectionAnchor>

				<SectionAnchor id="tag-builders" className="mt-8">
					<Suspense fallback={null}>
						<TagBuildersSection tagLabel={tag.label} />
					</Suspense>
				</SectionAnchor>
			</div>
		</>
	);
}

function TagPageFallback() {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-8">
			<div className="mt-6 space-y-4">
				<div>
					<div className="h-7 w-32 animate-pulse rounded bg-muted" />
					<div className="mt-2 h-4 w-52 animate-pulse rounded bg-muted" />
				</div>
				<div className="h-64 rounded-lg bg-card" />
			</div>
		</div>
	);
}
