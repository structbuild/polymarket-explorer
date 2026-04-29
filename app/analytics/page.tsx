import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { AnalyticsSection } from "@/components/analytics/analytics-section";
import {
	BuildersGlobalStats,
	BuildersGlobalStatsFallback,
} from "@/components/builders/builders-global-stats";
import { buildPageMetadata } from "@/lib/site-metadata";
import {
	getAnalyticsChanges,
	getAnalyticsDeltas,
	getAnalyticsTimeseries,
} from "@/lib/struct/analytics-queries";
import {
	parseAnalyticsParams,
	ANALYTICS_RANGE_LABELS,
} from "@/lib/struct/analytics-shared";
import {
	getBuilderGlobal,
	getBuilderGlobalChanges,
} from "@/lib/struct/builder-queries";

export const metadata: Metadata = buildPageMetadata({
	title: "Polymarket Analytics · Volume, Trades & Fees",
	description:
		"Global Polymarket analytics dashboard — daily volume, trade count, fees, unique traders, and yes/no flow across every market.",
	canonical: "/analytics",
});

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function AnalyticsPage({ searchParams }: Props) {
	return (
		<div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-4 sm:px-6 sm:py-6">
			<Suspense fallback={<AnalyticsPageFallback />}>
				<AnalyticsPageContent searchParams={searchParams} />
			</Suspense>
			<Suspense fallback={<BuildersStripFallback />}>
				<BuildersStrip />
			</Suspense>
		</div>
	);
}

async function BuildersStrip() {
	await connection();

	const [row, changes] = await Promise.all([
		getBuilderGlobal("lifetime"),
		getBuilderGlobalChanges("24h"),
	]);
	if (!row) return null;
	return (
		<section className="space-y-3">
			<div className="space-y-1">
				<h2 className="text-base font-medium text-foreground/90">Builders</h2>
				<p className="text-sm text-muted-foreground">
					Cumulative routing across every builder code.
				</p>
			</div>
			<BuildersGlobalStats row={row} changes={changes} />
		</section>
	);
}

function BuildersStripFallback() {
	return (
		<section className="space-y-3">
			<div className="space-y-1">
				<div className="h-5 w-24 animate-pulse rounded bg-muted" />
				<div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
			</div>
			<BuildersGlobalStatsFallback />
		</section>
	);
}

async function AnalyticsPageContent({ searchParams }: Props) {
	await connection();

	const resolvedSearchParams = await searchParams;
	const { view, range, resolution, defaultResolution } = parseAnalyticsParams(
		resolvedSearchParams,
		"global",
	);

	const description =
		view === "cumulative"
			? "Cumulative Polymarket activity across all time."
			: range === "all"
				? "Global Polymarket activity across all time."
				: `Global Polymarket activity over the last ${ANALYTICS_RANGE_LABELS[range].toLowerCase()}.`;

	return (
		<AnalyticsSection
			title="Analytics"
			description={description}
			range={range}
			view={view}
			resolution={resolution}
			defaultResolution={defaultResolution}
			headingLevel="h1"
			pathname="/analytics"
			fetchers={{
				deltas: () => getAnalyticsDeltas(range, resolution),
				timeseries: () => getAnalyticsTimeseries(range, resolution),
				changes: () => getAnalyticsChanges(range),
			}}
		/>
	);
}

function AnalyticsPageFallback() {
	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="space-y-2">
				<div className="h-8 w-36 animate-pulse rounded bg-muted" />
				<div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
			</div>
		</div>
	);
}
