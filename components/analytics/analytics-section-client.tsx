"use client";

import type { Route } from "next";
import { useCallback, useRef, useState, useTransition } from "react";

import { getAnalyticsSectionDataAction } from "@/app/actions";
import { AnalyticsChartsGrid, type AnalyticsMetricPlacement } from "@/components/analytics/analytics-charts-grid";
import { AnalyticsKpiStrip } from "@/components/analytics/analytics-kpi-strip";
import { AnalyticsCapToggle } from "@/components/analytics/cap-toggle";
import { AnalyticsRangeToggle } from "@/components/analytics/range-toggle";
import { AnalyticsResolutionToggle } from "@/components/analytics/resolution-toggle";
import { AnalyticsViewToggle } from "@/components/analytics/view-toggle";
import type { AnalyticsSectionData } from "@/lib/struct/analytics-section-data";
import {
	applyAnalyticsCap,
	computeTradeCountComponentTotals,
	computeVolumeComponentTotals,
	getDefaultResolution,
	parseAnalyticsCap,
	parseAnalyticsParams,
	restrictAnalyticsComponents,
	summarizeAnalytics,
	type AnalyticsMetricId,
	type AnalyticsQuerySource,
	type AnalyticsRange,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

type Props = {
	initialData: AnalyticsSectionData;
	source: AnalyticsQuerySource;
	title?: string;
	description?: string;
	defaultRange: AnalyticsRange;
	headingLevel: "h1" | "h2";
	excludeMetrics?: readonly AnalyticsMetricId[];
	appendMetrics?: readonly AnalyticsMetricId[];
	metricPlacements?: readonly AnalyticsMetricPlacement[];
	endTime?: number;
	initialCap: boolean;
	defaultCap: boolean;
	allowedComponents?: readonly VolumeComponentId[];
	pathname: string;
	showControls: boolean;
	showKpis: boolean;
	refreshedAt: string;
};

function replaceUrl(href: Route) {
	window.history.replaceState(window.history.state, "", href);
}

export function AnalyticsSectionClient({
	initialData,
	source,
	title,
	description,
	defaultRange,
	headingLevel,
	excludeMetrics,
	appendMetrics,
	metricPlacements,
	endTime,
	initialCap,
	defaultCap,
	allowedComponents,
	pathname,
	showControls,
	showKpis,
	refreshedAt: initialRefreshedAt,
}: Props) {
	const Heading = headingLevel;
	const [isPending, startTransition] = useTransition();
	const requestIdRef = useRef(0);
	const [state, setState] = useState(() => ({
		sourceData: initialData,
		data: initialData,
		cap: initialCap,
		refreshedAt: initialRefreshedAt,
	}));
	const current = state.sourceData === initialData
		? state
		: { sourceData: initialData, data: initialData, cap: initialCap, refreshedAt: initialRefreshedAt };
	const { data } = current;

	const load = useCallback((href: Route, params: URLSearchParams) => {
		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;
		const raw = Object.fromEntries(params.entries());
		const scope = source.kind === "global" || source.kind === "builderGlobal" ? "global" : "scoped";
		const next = parseAnalyticsParams(raw, scope, defaultRange);

		startTransition(async () => {
			try {
				const result = await getAnalyticsSectionDataAction({
					source,
					range: next.range,
					resolution: next.resolution,
					view: next.view,
					defaultRange,
					showKpis,
					excludeMetrics,
					appendMetrics,
					allowedComponents,
				});
				if (requestIdRef.current !== requestId) return;
				replaceUrl(href);
				setState({
					sourceData: initialData,
					data: result,
					cap: parseAnalyticsCap(raw.cap) ?? defaultCap,
					refreshedAt: new Date().toISOString(),
				});
			} catch (error) {
				if (requestIdRef.current !== requestId) return;
				console.error("Failed to load analytics section data", error);
			}
		});
	}, [allowedComponents, appendMetrics, defaultCap, defaultRange, excludeMetrics, initialData, showKpis, source]);

	const chartPoints = restrictAnalyticsComponents(
		applyAnalyticsCap(data.chartPoints, endTime, current.cap),
		allowedComponents,
	);
	const kpiPoints = data.kpiPoints
		? restrictAnalyticsComponents(data.kpiPoints, allowedComponents)
		: null;

	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				{title && (
					<div className="flex flex-col gap-0.5">
						<Heading className="text-lg font-medium text-foreground/90">{title}</Heading>
						{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
					</div>
				)}
				{showControls ? (
					<div className="flex flex-wrap items-center gap-2">
						{data.view === "deltas" ? (
							<AnalyticsRangeToggle
								range={data.range}
								defaultRange={defaultRange}
								pending={isPending}
								onNavigate={({ href, params }) => load(href, params)}
							/>
						) : null}
						<AnalyticsResolutionToggle
							range={data.range}
							resolution={data.resolution}
							defaultResolution={getDefaultResolution(
								data.range,
								source.kind === "global" || source.kind === "builderGlobal" ? "global" : "scoped",
							)}
							pending={isPending}
							onNavigate={({ href, params }) => load(href, params)}
						/>
						<AnalyticsViewToggle
							view={data.view}
							pending={isPending}
							onNavigate={({ href, params }) => load(href, params)}
						/>
						{endTime !== undefined ? (
							<AnalyticsCapToggle
								cap={current.cap}
								defaultCap={defaultCap}
								pending={isPending}
								onNavigate={({ href, cap }) => {
									replaceUrl(href);
									setState({ ...current, sourceData: initialData, cap });
								}}
							/>
						) : null}
					</div>
				) : null}
			</div>

			{showKpis && kpiPoints ? (
				<AnalyticsKpiStrip
					summary={summarizeAnalytics(kpiPoints)}
					volumeComponentTotals={computeVolumeComponentTotals(kpiPoints)}
					tradeCountComponentTotals={computeTradeCountComponentTotals(kpiPoints)}
					changes={data.changes}
					excludeMetrics={excludeMetrics}
					allowedComponents={allowedComponents}
				/>
			) : null}

			<AnalyticsChartsGrid
				points={chartPoints}
				view={data.view}
				resolution={data.resolution}
				excludeMetrics={excludeMetrics}
				appendMetrics={appendMetrics}
				metricPlacements={metricPlacements}
				pathname={pathname}
				refreshedAt={new Date(current.refreshedAt)}
				allowedComponents={allowedComponents}
			/>
		</div>
	);
}
