import type { Metadata } from "next";
import { Suspense } from "react";

import { AnalyticsSection } from "@/components/analytics/analytics-section";
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
		<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
			<Suspense fallback={<AnalyticsPageFallback />}>
				<AnalyticsPageContent searchParams={searchParams} />
			</Suspense>
		</div>
	);
}

async function AnalyticsPageContent({ searchParams }: Props) {
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
