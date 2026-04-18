import type { Metadata } from "next";

import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { buildPageMetadata } from "@/lib/site-metadata";
import {
	getAnalyticsChanges,
	getAnalyticsDeltas,
	getAnalyticsTimeseries,
} from "@/lib/struct/analytics-queries";
import {
	parseAnalyticsRange,
	parseAnalyticsView,
	ANALYTICS_RANGE_LABELS,
} from "@/lib/struct/analytics-shared";

export const metadata: Metadata = buildPageMetadata({
	title: "Analytics",
	description:
		"Global Polymarket analytics — volume, trades, fees, unique traders, and yes/no flow over time.",
	canonical: "/analytics",
});

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AnalyticsPage({ searchParams }: Props) {
	const { range: rangeParam, view: viewParam } = await searchParams;
	const view = parseAnalyticsView(viewParam);
	const range = view === "cumulative" ? "all" : parseAnalyticsRange(rangeParam);

	const description =
		view === "cumulative"
			? "Cumulative Polymarket activity across all time."
			: range === "all"
				? "Global Polymarket activity across all time."
				: `Global Polymarket activity over the last ${ANALYTICS_RANGE_LABELS[range].toLowerCase()}.`;

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
			<AnalyticsSection
				title="Analytics"
				description={description}
				range={range}
				view={view}
				headingLevel="h1"
				fetchers={{
					deltas: () => getAnalyticsDeltas(range),
					timeseries: () => getAnalyticsTimeseries(range),
					changes: () => getAnalyticsChanges(range),
				}}
			/>
		</div>
	);
}
