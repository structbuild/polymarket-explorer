"use client";

import { AnalyticsUrlToggle } from "@/components/analytics/url-toggle";
import {
	ANALYTICS_RANGES,
	ANALYTICS_RANGE_LABELS,
	DEFAULT_ANALYTICS_RANGE,
	type AnalyticsRange,
} from "@/lib/struct/analytics-shared";

export function AnalyticsRangeToggle({ range }: { range: AnalyticsRange }) {
	return (
		<AnalyticsUrlToggle
			paramKey="range"
			value={range}
			options={ANALYTICS_RANGES}
			labels={ANALYTICS_RANGE_LABELS}
			defaultValue={DEFAULT_ANALYTICS_RANGE}
		/>
	);
}
