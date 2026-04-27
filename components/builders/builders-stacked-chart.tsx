"use client";

import { useMemo, useState } from "react";

import { AnalyticsChart, type AnalyticsSeries } from "@/components/analytics/analytics-chart";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	BUILDERS_STACKED_METRICS,
	BUILDERS_STACKED_METRIC_FORMAT,
	BUILDERS_STACKED_METRIC_LABELS,
	OTHER_SLOT,
	fieldKey,
	type BuildersStackedData,
	type BuildersStackedMetric,
	type BuildersStackedSlot,
} from "@/lib/struct/builders-stacked-shared";

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
	timeframeLabel: string;
};

export function BuildersStackedChart({
	stacked,
	timeframeLabel,
}: BuildersStackedChartProps) {
	const [metric, setMetric] = useState<BuildersStackedMetric>("volume");
	const metricData = stacked.byMetric[metric];

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
		<ToggleGroup
			value={[metric]}
			onValueChange={(raw) => {
				const next = Array.isArray(raw) ? raw[0] : raw;
				if (next && (BUILDERS_STACKED_METRICS as readonly string[]).includes(next)) {
					setMetric(next as BuildersStackedMetric);
				}
			}}
			variant="outline"
			size="sm"
		>
			{BUILDERS_STACKED_METRICS.map((id) => (
				<ToggleGroupItem
					key={id}
					value={id}
					aria-label={`Show ${BUILDERS_STACKED_METRIC_LABELS[id]}`}
				>
					{BUILDERS_STACKED_METRIC_LABELS[id]}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
	return (
		<div>
			<Card variant="analytics">
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div className="space-y-1">
							<h2 className="text-base font-medium text-foreground/90">
								Builder activity composition
							</h2>
							<p className="text-sm text-muted-foreground">
								Top builders across {timeframeLabel.toLowerCase()}, with the rest grouped as Other.
							</p>
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
							resolution={stacked.resolution}
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
