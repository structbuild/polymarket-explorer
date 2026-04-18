"use client";

import { AnalyticsUrlToggle } from "@/components/analytics/url-toggle";
import {
	ANALYTICS_VIEWS,
	ANALYTICS_VIEW_LABELS,
	DEFAULT_ANALYTICS_VIEW,
	type AnalyticsView,
} from "@/lib/struct/analytics-shared";

export function AnalyticsViewToggle({ view }: { view: AnalyticsView }) {
	return (
		<AnalyticsUrlToggle
			paramKey="view"
			value={view}
			options={ANALYTICS_VIEWS}
			labels={ANALYTICS_VIEW_LABELS}
			defaultValue={DEFAULT_ANALYTICS_VIEW}
			transformParams={(params, next) => {
				if (next === "cumulative") params.delete("range");
			}}
		/>
	);
}
