"use client";

import { AnalyticsUrlToggle } from "@/components/analytics/url-toggle";
import {
	ANALYTICS_RESOLUTION_DESCRIPTIONS,
	ANALYTICS_RESOLUTION_LABELS,
	RESOLUTION_OPTIONS_BY_RANGE,
	type AnalyticsRange,
	type AnalyticsResolution,
} from "@/lib/struct/analytics-shared";

type Props = {
	range: AnalyticsRange;
	resolution: AnalyticsResolution;
	defaultResolution: AnalyticsResolution;
};

export function AnalyticsResolutionToggle({ range, resolution, defaultResolution }: Props) {
	const options = RESOLUTION_OPTIONS_BY_RANGE[range];
	if (options.length === 0) return null;
	return (
		<AnalyticsUrlToggle
			paramKey="resolution"
			value={resolution}
			options={options}
			labels={ANALYTICS_RESOLUTION_LABELS}
			descriptions={ANALYTICS_RESOLUTION_DESCRIPTIONS}
			defaultValue={defaultResolution}
			ariaLabelPrefix="Show bucket"
		/>
	);
}
