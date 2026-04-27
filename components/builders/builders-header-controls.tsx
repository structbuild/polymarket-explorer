"use client";

import type { BuilderTimeframe } from "@structbuild/sdk";

import { AnalyticsUrlToggle } from "@/components/analytics/url-toggle";
import {
	ANALYTICS_RESOLUTION_DESCRIPTIONS,
	ANALYTICS_RESOLUTION_LABELS,
	RESOLUTION_OPTIONS_BY_RANGE,
	type AnalyticsResolution,
} from "@/lib/struct/analytics-shared";
import {
	BUILDER_TIMEFRAME_LABELS,
	BUILDER_TIMEFRAME_OPTIONS,
	DEFAULT_BUILDER_TIMEFRAME,
} from "@/lib/struct/builder-shared";
import { resolveStackedRange } from "@/lib/struct/builders-stacked-shared";

const BUILDER_TIMEFRAME_DESCRIPTIONS: Record<BuilderTimeframe, string> = {
	"1d": "Rank builders by the last 24 hours of routed activity.",
	"7d": "Rank builders by the last 7 days of routed activity.",
	"30d": "Rank builders by the last 30 days of routed activity.",
	lifetime: "Rank builders by all available routed activity.",
};

type BuildersHeaderControlsProps = {
	timeframe: BuilderTimeframe;
	resolution: AnalyticsResolution;
};

export function BuildersHeaderControls({
	timeframe,
	resolution,
}: BuildersHeaderControlsProps) {
	const { range, resolution: defaultResolution } = resolveStackedRange(timeframe);
	return (
		<div className="flex flex-wrap items-center gap-2 sm:justify-end">
			<AnalyticsUrlToggle
				paramKey="timeframe"
				value={timeframe}
				options={BUILDER_TIMEFRAME_OPTIONS}
				labels={BUILDER_TIMEFRAME_LABELS}
				descriptions={BUILDER_TIMEFRAME_DESCRIPTIONS}
				defaultValue={DEFAULT_BUILDER_TIMEFRAME}
				ariaLabelPrefix="Show timeframe"
				transformParams={(params) => {
					params.delete("resolution");
				}}
			/>
			<AnalyticsUrlToggle
				paramKey="resolution"
				value={resolution}
				options={RESOLUTION_OPTIONS_BY_RANGE[range]}
				labels={ANALYTICS_RESOLUTION_LABELS}
				descriptions={ANALYTICS_RESOLUTION_DESCRIPTIONS}
				defaultValue={defaultResolution}
				ariaLabelPrefix="Show bucket"
			/>
		</div>
	);
}
