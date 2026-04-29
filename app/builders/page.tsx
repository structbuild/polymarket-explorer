import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { BuildersHeaderControls } from "@/components/builders/builders-header-controls";
import {
	BuildersGlobalStats,
	BuildersGlobalStatsFallback,
} from "@/components/builders/builders-global-stats";
import {
	BuildersGlobalTags,
	BuildersGlobalTagsFallback,
} from "@/components/builders/builders-global-tags";
import {
	BuildersStackedChart,
	BuildersStackedChartFallback,
} from "@/components/builders/builders-stacked-chart";
import { SortableBuildersTable } from "@/components/builders/sortable-builders-table";
import { BUILDERS_SKELETON_COLUMNS } from "@/components/builders/builders-table-columns";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { getSiteUrl } from "@/lib/env";
import { parsePageParam } from "@/lib/pagination";
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import {
	getBuilderGlobalAnalyticsChanges,
	getBuilderGlobalAnalyticsDeltas,
	getBuilderGlobalAnalyticsTimeseries,
} from "@/lib/struct/analytics-queries";
import {
	parseAnalyticsParams,
	type AnalyticsResolution,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";
import {
	getBuildersPaginated,
	getBuilderGlobal,
	getBuilderGlobalChanges,
	getBuilderGlobalTags,
} from "@/lib/struct/builder-queries";
import {
	BUILDER_TIMEFRAME_LABELS,
	getBuilderSortOptionsForTimeframe,
	parseBuilderSort,
	parseBuilderTimeframe,
} from "@/lib/struct/builder-shared";
import { getBuildersStackedData } from "@/lib/struct/builders-stacked";
import {
	DEFAULT_BUILDERS_STACKED_TOP_N,
	parseBuildersStackedMetric,
	parseBuildersStackedResolution,
	type BuildersStackedMetric,
} from "@/lib/struct/builders-stacked-shared";
import type { BuilderSortBy, BuilderTimeframe } from "@structbuild/sdk";
import { getBuilderDisplayName } from "@/lib/builder-display-name";

export const metadata: Metadata = buildPageMetadata({
	title: "Polymarket Builders · Volume, Fees & Routing",
	description:
		"Discover the apps, bots, and integrators routing the most volume into Polymarket. Sortable by volume, trades, traders, fees, and builder fees earned.",
	canonical: "/builders",
});

const BUILDERS_PAGE_SIZE = 50;
const BUILDERS_GLOBAL_TAGS_LIMIT = 12;
const BUILDER_ANALYTICS_COMPONENTS = ["buy", "sell"] as const satisfies readonly VolumeComponentId[];
const BUILDER_ANALYTICS_METRIC_PLACEMENTS = [
	{ metric: "builderFees", after: "volume" },
	{ metric: "newUsers", after: "builderFees" },
	{ metric: "uniqueTraders", after: "newUsers" },
	{ metric: "makersTakers", after: "uniqueTraders" },
	{ metric: "tradeTypes", after: "makersTakers" },
	{ metric: "avgTradeSize", after: "tradeTypes" },
	{ metric: "fees", after: "avgTradeSize" },
	{ metric: "avgRevenuePerUser", after: "fees" },
	{ metric: "avgVolumePerUser", after: "avgRevenuePerUser" },
	{ metric: "yesNo", after: "avgVolumePerUser" },
	{ metric: "yesNoCount", after: "yesNo" },
	{ metric: "shares", after: "yesNoCount" },
	{ metric: "buyDistribution", after: "shares" },
] as const;
const BUILDER_GLOBAL_TAG_SORT_OPTIONS = [
	"volume",
	"builder_fees",
	"traders",
	"txns",
	"fees",
	"new_users",
	"avg_rev_per_user",
	"avg_vol_per_user",
] as const satisfies readonly BuilderSortBy[];

type BuilderGlobalTagSort = (typeof BUILDER_GLOBAL_TAG_SORT_OPTIONS)[number];

function parseBuilderGlobalTagSort(
	value: string | string[] | undefined,
	timeframe: BuilderTimeframe,
): BuilderGlobalTagSort {
	const raw = Array.isArray(value) ? value[0] : value;
	return BUILDER_GLOBAL_TAG_SORT_OPTIONS.includes(raw as BuilderGlobalTagSort) &&
		getBuilderSortOptionsForTimeframe(timeframe).includes(raw as BuilderSortBy)
		? (raw as BuilderGlobalTagSort)
		: "volume";
}

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BuildersPage({ searchParams }: Props) {
	await connection();

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Suspense fallback={<BuildersIndexFallback />}>
				<BuildersIndexContent searchParams={searchParams} />
			</Suspense>
		</div>
	);
}

async function BuildersIndexContent({ searchParams }: Props) {
	const resolved = await searchParams;
	const timeframe = parseBuilderTimeframe(resolved.timeframe);
	const sort = parseBuilderSort(resolved.sort, timeframe);
	const resolution = parseBuildersStackedResolution(timeframe, resolved.resolution);
	const stackedMetric = parseBuildersStackedMetric(resolved.breakdownMetric, timeframe);
	const analytics = parseAnalyticsParams(resolved, "global", "30d");
	const tagSort = parseBuilderGlobalTagSort(resolved.tagSort, timeframe);
	const pageParam = typeof resolved.page === "string" ? parsePageParam(resolved.page) : null;
	const page = pageParam ?? 1;
	const offset = (page - 1) * BUILDERS_PAGE_SIZE;

	const [{ data: builders, hasMore }, globalRow, globalChanges, globalTags] = await Promise.all([
		getBuildersPaginated(BUILDERS_PAGE_SIZE, offset, sort, timeframe),
		getBuilderGlobal(timeframe),
		getBuilderGlobalChanges(timeframe === "lifetime" ? "1y" : timeframe === "1d" ? "24h" : timeframe),
		getBuilderGlobalTags(tagSort, timeframe, BUILDERS_GLOBAL_TAGS_LIMIT),
	]);

	const siteUrl = getSiteUrl();
	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `Polymarket Builders — ${SITE_NAME}`,
		description: `Polymarket builders ranked by activity on ${SITE_NAME}.`,
		url: new URL("/builders", siteUrl).toString(),
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: builders.length,
			itemListElement: builders.map((builder, index) => ({
				"@type": "ListItem",
				position: offset + index + 1,
				name: getBuilderDisplayName(builder.builder_code, builder.metadata ?? null),
				url: new URL(
					`/builders/${encodeURIComponent(builder.builder_code)}`,
					siteUrl,
				).toString(),
			})),
		},
	};

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Builders", href: "/builders" },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6 space-y-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="text-xl font-medium tracking-tight">Builders</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Analyze individual builders and their activity.
						</p>
					</div>
					<BuildersHeaderControls timeframe={timeframe} resolution={resolution} />
				</div>

				<BuildersGlobalStats row={globalRow} changes={globalChanges} />

				<Suspense fallback={<BuildersStackedChartFallback />}>
					<BuildersStackedSection
						timeframe={timeframe}
						resolution={resolution}
						metric={stackedMetric}
					/>
				</Suspense>

				<SortableBuildersTable
					builders={builders}
					sort={sort}
					timeframe={timeframe}
					pageIndex={page - 1}
					pageSize={BUILDERS_PAGE_SIZE}
					hasNextPage={hasMore}
					rankOffset={offset}
					toolbarLeft={
						<h2 className="text-lg font-medium text-foreground/90">
							Builder leaderboard
						</h2>
					}
				/>

				<AnalyticsSection
					title="Builder activity"
					range={analytics.range}
					view={analytics.view}
					resolution={analytics.resolution}
					defaultResolution={analytics.defaultResolution}
					defaultRange={analytics.defaultRange}
					pathname="/builders"
					fetchers={{
						deltas: () => getBuilderGlobalAnalyticsDeltas(analytics.range, analytics.resolution),
						timeseries: () =>
							getBuilderGlobalAnalyticsTimeseries(analytics.range, analytics.resolution),
						changes: () => getBuilderGlobalAnalyticsChanges(analytics.range),
					}}
					appendMetrics={[
						"builderFees",
						"newUsers",
						"avgRevenuePerUser",
						"avgVolumePerUser",
						"fees",
						"uniqueTraders",
						"avgTradeSize",
					]}
					metricPlacements={BUILDER_ANALYTICS_METRIC_PLACEMENTS}
					allowedComponents={BUILDER_ANALYTICS_COMPONENTS}
				/>

				<Suspense fallback={<BuildersGlobalTagsFallback />}>
					<BuildersGlobalTags rows={globalTags.data} sort={tagSort} timeframe={timeframe} />
				</Suspense>
			</div>
		</>
	);
}

async function BuildersStackedSection({
	timeframe,
	resolution,
	metric,
}: {
	timeframe: BuilderTimeframe;
	resolution: AnalyticsResolution;
	metric: BuildersStackedMetric;
}) {
	const stacked = await getBuildersStackedData({
		topN: DEFAULT_BUILDERS_STACKED_TOP_N,
		timeframe,
		resolution,
		metric,
	});
	return (
		<BuildersStackedChart
			stacked={stacked}
			timeframe={timeframe}
			resolution={resolution}
			timeframeLabel={BUILDER_TIMEFRAME_LABELS[timeframe]}
		/>
	);
}

function BuildersIndexFallback() {
	return (
		<div className="mt-6 space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<div className="h-7 w-32 animate-pulse rounded bg-muted" />
					<div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
				</div>
				<div className="h-8 w-56 max-w-full animate-pulse rounded bg-muted" />
			</div>
			<BuildersGlobalStatsFallback />
			<BuildersGlobalTagsFallback />
			<BuildersStackedChartFallback />
			<DataTableSkeleton columns={BUILDERS_SKELETON_COLUMNS} rowCount={BUILDERS_PAGE_SIZE} />
		</div>
	);
}
