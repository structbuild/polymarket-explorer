import type { Metadata } from "next";
import { Suspense } from "react";

import { BuildersHeaderControls } from "@/components/builders/builders-header-controls";
import {
	BuildersGlobalStats,
	BuildersGlobalStatsFallback,
} from "@/components/builders/builders-global-stats";
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
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import {
	getBuildersPaginated,
	getBuilderGlobal,
	getBuilderGlobalChanges,
} from "@/lib/struct/builder-queries";
import {
	BUILDER_TIMEFRAME_LABELS,
	parseBuilderSort,
	parseBuilderTimeframe,
} from "@/lib/struct/builder-shared";
import { getBuildersStackedData } from "@/lib/struct/builders-stacked";
import { parseBuildersStackedResolution } from "@/lib/struct/builders-stacked-shared";
import type { BuilderTimeframe } from "@structbuild/sdk";
import type { AnalyticsResolution } from "@/lib/struct/analytics-shared";
import { formatBuilderCodeDisplay } from "@/lib/utils";

export const metadata: Metadata = buildPageMetadata({
	title: "Polymarket Builders · Volume, Fees & Routing",
	description:
		"Discover the apps, bots, and integrators routing the most volume into Polymarket. Sortable by volume, trades, traders, fees, and builder fees earned.",
	canonical: "/builders",
});

const BUILDERS_INDEX_LIMIT = 250;
const BUILDERS_STACKED_TOP_N = 7;

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function BuildersPage({ searchParams }: Props) {
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
	const sort = parseBuilderSort(resolved.sort);
	const timeframe = parseBuilderTimeframe(resolved.timeframe);
	const resolution = parseBuildersStackedResolution(timeframe, resolved.resolution);

	const [{ data: builders }, globalRow, globalChanges] = await Promise.all([
		getBuildersPaginated(BUILDERS_INDEX_LIMIT, 0, sort, timeframe),
		getBuilderGlobal(timeframe),
		getBuilderGlobalChanges(timeframe === "lifetime" ? "1y" : timeframe === "1d" ? "24h" : timeframe),
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
				position: index + 1,
				name: formatBuilderCodeDisplay(builder.builder_code),
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

			<div className="mt-6 space-y-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="text-xl font-medium tracking-tight">Builders</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Apps, bots, and integrators routing volume into Polymarket.
						</p>
					</div>
					<BuildersHeaderControls timeframe={timeframe} resolution={resolution} />
				</div>

				<BuildersGlobalStats row={globalRow} changes={globalChanges} />

				<Suspense fallback={<BuildersStackedChartFallback />}>
					<BuildersStackedSection
						timeframe={timeframe}
						resolution={resolution}
					/>
				</Suspense>

				<SortableBuildersTable builders={builders} sort={sort} timeframe={timeframe} />
			</div>
		</>
	);
}

async function BuildersStackedSection({
	timeframe,
	resolution,
}: {
	timeframe: BuilderTimeframe;
	resolution: AnalyticsResolution;
}) {
	const stacked = await getBuildersStackedData({
		topN: BUILDERS_STACKED_TOP_N,
		timeframe,
		resolution,
	});
	return (
		<BuildersStackedChart
			stacked={stacked}
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
			<BuildersStackedChartFallback />
			<DataTableSkeleton columns={BUILDERS_SKELETON_COLUMNS} rowCount={10} />
		</div>
	);
}
