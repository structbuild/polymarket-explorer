"use client";

import { useMemo, useState, useTransition } from "react";
import type { BuilderTimeframe } from "@structbuild/sdk";

import { getBuildersStackedDataAction } from "@/app/actions";
import { AnalyticsUrlToggle } from "@/components/analytics/url-toggle";
import { AnalyticsChart, type AnalyticsSeries } from "@/components/analytics/analytics-chart";
import { Card, CardContent } from "@/components/ui/card";
import {
	DEFAULT_BUILDERS_STACKED_METRIC,
	BUILDERS_STACKED_METRIC_FORMAT,
	BUILDERS_STACKED_METRIC_LABELS,
	OTHER_SLOT,
	fieldKey,
	getBuildersStackedMetricOptionsForTimeframe,
	type BuildersStackedData,
	type BuildersStackedSlot,
} from "@/lib/struct/builders-stacked-shared";
import type { AnalyticsResolution } from "@/lib/struct/analytics-shared";

const BUILDER_PALETTE = [
	"#10b981",
	"#8b5cf6",
	"#f59e0b",
	"#06b6d4",
	"#ef4444",
	"#ec4899",
	"#84cc16",
	"#3b82f6",
];

const OTHER_COLOR = "#64748b";

function colorFor(slot: BuildersStackedSlot, idx: number): string {
	if (slot.id === OTHER_SLOT) return OTHER_COLOR;
	return BUILDER_PALETTE[idx % BUILDER_PALETTE.length];
}

type BuildersStackedChartProps = {
	stacked: BuildersStackedData;
	timeframe: BuilderTimeframe;
	resolution: AnalyticsResolution;
	timeframeLabel: string;
};

export function BuildersStackedChart({
	stacked,
	timeframe,
	resolution,
	timeframeLabel,
}: BuildersStackedChartProps) {
	const [isPending, startTransition] = useTransition();
	const [stackedState, setStackedState] = useState(() => ({
		sourceStacked: stacked,
		sourceTimeframe: timeframe,
		sourceResolution: resolution,
		stacked,
	}));
	const hasLocalStacked =
		stackedState.sourceStacked === stacked &&
		stackedState.sourceTimeframe === timeframe &&
		stackedState.sourceResolution === resolution;
	const currentStacked = hasLocalStacked ? stackedState.stacked : stacked;
	const metric = currentStacked.metric;
	const metricData = currentStacked;
	const metricOptions = useMemo(
		() => getBuildersStackedMetricOptionsForTimeframe(timeframe),
		[timeframe],
	);

	const series = useMemo<AnalyticsSeries[]>(() => {
		return metricData.slots.map((slot, idx) => ({
			key: fieldKey(slot.id, metric),
			label: slot.label,
			color: colorFor(slot, idx),
			stackId: "builders",
		}));
	}, [metricData.slots, metric]);

	const valueFormat = BUILDERS_STACKED_METRIC_FORMAT[metric];
	const hasData = metricData.data.length > 0 && metricData.slots.length > 1;
	const chartMetricToggle = (
		<AnalyticsUrlToggle
			paramKey="breakdownMetric"
			value={metric}
			options={metricOptions}
			labels={BUILDERS_STACKED_METRIC_LABELS}
			defaultValue={DEFAULT_BUILDERS_STACKED_METRIC}
			ariaLabelPrefix="Show builder breakdown"
			transformParams={(params, next) => {
				params.set("breakdownMetric", next);
			}}
			pending={isPending}
			onNavigate={({ href, next }) => {
				window.history.replaceState(window.history.state, "", href);
				startTransition(async () => {
					const result = await getBuildersStackedDataAction({
						metric: next,
						timeframe,
						resolution,
					});

					setStackedState({
						sourceStacked: stacked,
						sourceTimeframe: timeframe,
						sourceResolution: resolution,
						stacked: result,
					});
				});
			}}
		/>
	);
	return (
		<div>
			<Card variant="analytics">
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div className="space-y-1">
							<h2 className="text-base font-medium text-foreground/90">
								Builder activity breakdown
							</h2>
							<p className="text-sm text-muted-foreground">{timeframeLabel}</p>
						</div>
						{chartMetricToggle}
					</div>

					{hasData ? (
						<AnalyticsChart
							data={metricData.data}
							variant="bar"
							series={series}
							valueFormat={valueFormat}
							interactiveLegend
							resolution={currentStacked.resolution}
							height="lg"
						/>
					) : (
						<div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground sm:h-[420px]">
							No builder activity in this window.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export function BuildersStackedChartFallback() {
	return (
		<div>
			<Card variant="analytics">
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div className="space-y-1">
							<div className="h-5 w-44 animate-pulse rounded bg-muted" />
							<div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
						</div>
						<div className="h-8 w-72 max-w-full animate-pulse rounded bg-muted" />
					</div>
					<div className="h-[320px] w-full animate-pulse rounded-lg bg-muted/40 sm:h-[420px]" />
				</CardContent>
			</Card>
		</div>
	);
}
