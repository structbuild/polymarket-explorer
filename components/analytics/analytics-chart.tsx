"use client";

import posthog from "posthog-js";
import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	XAxis,
	YAxis,
} from "recharts";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { ChartWatermark } from "@/components/analytics/chart-watermark";
import {
	formatDateCompact,
	formatDateFull,
	formatDateTimeCompact,
	formatDateTimeFull,
	formatNumber,
	formatTimeCompact,
} from "@/lib/format";
import { useProjectIncomplete } from "@/lib/hooks/use-project-incomplete";
import { useShareMode } from "@/lib/hooks/use-share-mode";
import type { AnalyticsResolution } from "@/lib/struct/analytics-shared";
import { cn } from "@/lib/utils";

const SECONDS_PER_DAY = 86400;
const RESOLUTION_SECONDS: Partial<Record<AnalyticsResolution, number>> = {
	"60": 3600,
	"240": 14400,
	D: SECONDS_PER_DAY,
	W: 7 * SECONDS_PER_DAY,
};
const INCOMPLETE_BUCKET_NOTE = "Partial bucket; still in progress.";
const PROJECTED_BUCKET_NOTE =
	"Projected from current pace based on results so far. Not reliable for analysis.";

function detectGranularity(data: { t: number }[]): "intraday-short" | "intraday" | "daily" {
	let minDelta = Number.POSITIVE_INFINITY;
	for (let i = 1; i < data.length; i++) {
		const delta = data[i].t - data[i - 1].t;
		if (delta > 0 && delta < minDelta) minDelta = delta;
	}
	if (!Number.isFinite(minDelta)) return "daily";
	if (minDelta < SECONDS_PER_DAY / 4) return "intraday-short";
	if (minDelta < SECONDS_PER_DAY) return "intraday";
	return "daily";
}

export type AnalyticsSeries = {
	key: string;
	label: string;
	color: string;
	stackId?: string;
	isTotal?: boolean;
	defaultHidden?: boolean;
};

export type AnalyticsValueFormat = "currency" | "count";

type AnalyticsDatum = { t: number } & Record<string, number>;

type AnalyticsChartHeight = "default" | "lg" | "xl";

type AnalyticsChartProps = {
	data: AnalyticsDatum[];
	variant: "area" | "bar";
	series: AnalyticsSeries[];
	valueFormat: AnalyticsValueFormat;
	formatValue?: (value: number) => string;
	interactiveLegend?: boolean;
	showIncomplete?: boolean;
	projectIncomplete?: boolean;
	resolution?: AnalyticsResolution;
	labelMode?: "bucket" | "point";
	height?: AnalyticsChartHeight;
	className?: string;
};

const HEIGHT_CLASSES: Record<AnalyticsChartHeight, string> = {
	default: "h-[240px] min-h-[240px] sm:h-[300px]",
	lg: "h-[320px] min-h-[320px] sm:h-[420px]",
	xl: "h-[400px] min-h-[400px] sm:h-[520px]",
};

const HEIGHT_BASE_CLASS =
	"w-full group-data-[share-mode=image]/share-card:h-full group-data-[share-mode=image]/share-card:min-h-0 group-data-[share-mode=image]/share-card:flex-1";

function stripTrailingZeros(formatted: string): string {
	return formatted
		.replace(/(\.\d*?)0+([A-Z]?)$/, "$1$2")
		.replace(/\.([A-Z]?)$/, "$1");
}

function valueFormatter(value: number, format: AnalyticsValueFormat) {
	if (format === "currency") {
		return formatNumber(value, { compact: true, currency: true });
	}
	return stripTrailingZeros(formatNumber(value, { compact: true }));
}

function getBucketEndSeconds(startSeconds: number, resolution: AnalyticsResolution): number {
	if (resolution === "M") {
		const end = new Date(startSeconds * 1000);
		end.setUTCMonth(end.getUTCMonth() + 1);
		return Math.floor(end.getTime() / 1000) - 1;
	}
	const step = RESOLUTION_SECONDS[resolution];
	return step ? startSeconds + step - 1 : startSeconds;
}

function getBucketDurationSeconds(
	startSeconds: number,
	resolution: AnalyticsResolution | undefined,
	stepSeconds: number,
): number {
	if (resolution) {
		return getBucketEndSeconds(startSeconds, resolution) - startSeconds + 1;
	}
	return stepSeconds;
}

function getIncompleteProjectionScale(
	startSeconds: number,
	nowSeconds: number,
	resolution: AnalyticsResolution | undefined,
	stepSeconds: number,
): number {
	const elapsed = nowSeconds - startSeconds;
	if (elapsed <= 0) return 1;
	const fullDuration = getBucketDurationSeconds(startSeconds, resolution, stepSeconds);
	if (fullDuration <= 0 || elapsed >= fullDuration) return 1;
	return fullDuration / elapsed;
}

function formatBucketLabel(startSeconds: number, resolution: AnalyticsResolution): string {
	if (resolution === "D") return formatDateFull(startSeconds);

	const endSeconds = getBucketEndSeconds(startSeconds, resolution);
	const formatter =
		resolution === "60" || resolution === "240" ? formatDateTimeFull : formatDateFull;
	return `${formatter(startSeconds)} - ${formatter(endSeconds)}`;
}

export function AnalyticsChart({
	data,
	variant,
	series,
	valueFormat,
	formatValue,
	interactiveLegend = false,
	showIncomplete = true,
	projectIncomplete = true,
	resolution,
	labelMode = "bucket",
	height = "default",
	className,
}: AnalyticsChartProps) {
	const formatTick = formatValue ?? ((value: number) => valueFormatter(value, valueFormat));
	const { enabled: projectIncompletePref } = useProjectIncomplete();
	const allowProjectIncomplete = projectIncomplete && projectIncompletePref;
	const heightClass = `${HEIGHT_CLASSES[height]} ${HEIGHT_BASE_CLASS}`;
	const chartConfig = useMemo<ChartConfig>(() => {
		const config: ChartConfig = {};
		for (const s of series) {
			config[s.key] = { label: s.label, color: s.color };
		}
		return config;
	}, [series]);

	const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => {
		const hidden = new Set<string>();
		for (const s of series) {
			if (s.isTotal || s.defaultHidden) hidden.add(s.key);
		}
		return hidden;
	});
	const toggleKey = useCallback(
		(key: string) => {
			setHiddenKeys((prev) => {
				const clicked = series.find((s) => s.key === key);
				const totalKeys = series.filter((s) => s.isTotal).map((s) => s.key);
				const nonTotalKeys = series.filter((s) => !s.isTotal).map((s) => s.key);
				const totalVisible = totalKeys.some((k) => !prev.has(k));

				if (clicked?.isTotal) {
					const next = new Set<string>();
					if (totalVisible) {
						for (const k of totalKeys) next.add(k);
					} else {
						for (const k of nonTotalKeys) next.add(k);
					}
					return next;
				}

				const next = new Set(prev);
				if (totalVisible) {
					for (const k of totalKeys) next.add(k);
					for (const k of nonTotalKeys) next.delete(k);
				}
				if (next.has(key)) next.delete(key);
				else next.add(key);
				return next;
			});
		},
		[series],
	);
	const visibleSeries = useMemo(
		() => (interactiveLegend ? series.filter((s) => !hiddenKeys.has(s.key)) : series),
		[series, hiddenKeys, interactiveLegend],
	);

	const gradientPrefix = useId().replace(/:/g, "");
	const shareMode = useShareMode();
	const [nowSeconds] = useState(() => Math.floor(Date.now() / 1000));

	const granularity = useMemo(() => detectGranularity(data), [data]);
	const incompleteMeta = useMemo(() => {
		if (!showIncomplete) return null;
		if (data.length < 2) return null;
		const last = data[data.length - 1];
		const step = last.t - data[data.length - 2].t;
		if (step <= 0) return null;
		if (last.t + step <= nowSeconds) return null;
		return { t: last.t, step };
	}, [data, showIncomplete, nowSeconds]);
	const lastIncompleteT = incompleteMeta?.t ?? null;
	const incompleteProjectionScale = useMemo(() => {
		if (!incompleteMeta || !allowProjectIncomplete || labelMode !== "bucket") return 1;
		return getIncompleteProjectionScale(
			incompleteMeta.t,
			nowSeconds,
			resolution,
			incompleteMeta.step,
		);
	}, [incompleteMeta, allowProjectIncomplete, labelMode, nowSeconds, resolution]);
	const projectsIncomplete =
		lastIncompleteT !== null &&
		allowProjectIncomplete &&
		labelMode === "bucket" &&
		incompleteProjectionScale > 1;
	const showShimmer = lastIncompleteT !== null && !shareMode;
	const chartData = useMemo(() => {
		if (!projectsIncomplete || !incompleteMeta) return data;
		const scale = incompleteProjectionScale;
		return data.map((d) => {
			const out: AnalyticsDatum = { ...d };
			const isIncomplete = d.t === incompleteMeta.t;
			for (const s of series) {
				const actual = d[s.key];
				if (typeof actual !== "number") continue;
				if (isIncomplete) {
					const projected = actual * scale;
					out[`${s.key}__actual`] = actual;
					out[`${s.key}__proj`] = Math.max(0, projected - actual);
					out[s.key] = projected;
				} else {
					out[`${s.key}__actual`] = actual;
					out[`${s.key}__proj`] = 0;
				}
			}
			return out;
		});
	}, [data, series, projectsIncomplete, incompleteMeta, incompleteProjectionScale]);
	const areaData = useMemo(() => {
		if (!showShimmer || chartData.length < 2) return chartData;
		const lastIdx = chartData.length - 1;
		return chartData.map((d, i) => {
			const out: AnalyticsDatum = { ...d };
			for (const s of series) {
				out[`${s.key}__solid`] = (i < lastIdx ? d[s.key] : null) as number;
				out[`${s.key}__tail`] = (i >= lastIdx - 1 ? d[s.key] : null) as number;
			}
			return out;
		});
	}, [chartData, series, showShimmer]);
	const mergeProjectedTooltipPayload = useCallback(
		<T extends { dataKey?: unknown; value?: unknown; name?: unknown; color?: string; payload?: unknown }>(
			payload: ReadonlyArray<T> | undefined,
		): ReadonlyArray<T> | undefined => {
			if (!projectsIncomplete || !payload?.length) return payload;
			const byKey = new Map<string, T>();
			for (const item of payload) {
				const dataKey = String(item.dataKey ?? "");
				if (dataKey.endsWith("__proj")) continue;
				if (dataKey.endsWith("__actual")) {
					const baseKey = dataKey.slice(0, -"__actual".length);
					const seriesItem = series.find((s) => s.key === baseKey);
					const actualVal = typeof item.value === "number" ? item.value : Number(item.value) || 0;
					byKey.set(baseKey, {
						...item,
						dataKey: baseKey,
						name: seriesItem?.label ?? item.name,
						value: actualVal,
						color: seriesItem?.color ?? item.color,
					});
					continue;
				}
				if (!dataKey.includes("__")) {
					const row = item.payload as AnalyticsDatum | undefined;
					const actual = row?.[`${dataKey}__actual`];
					byKey.set(dataKey, {
						...item,
						value: typeof actual === "number" ? actual : item.value,
					});
				}
			}
			return visibleSeries.map((s) => byKey.get(s.key)).filter((item): item is T => item != null);
		},
		[projectsIncomplete, series, visibleSeries],
	);
	const xAxisFormatter = useMemo(() => {
		if (granularity === "intraday-short") return formatTimeCompact;
		if (granularity === "intraday") return formatDateTimeCompact;
		return formatDateCompact;
	}, [granularity]);
	const tooltipLabelFormatter = granularity === "daily" ? formatDateFull : formatDateTimeFull;
	const formatTooltipLabel = useCallback(
		(seconds: number) => {
			const label =
				resolution && labelMode === "bucket"
					? formatBucketLabel(seconds, resolution)
					: tooltipLabelFormatter(seconds);
			if (seconds !== lastIncompleteT) return label;
			if (resolution && labelMode === "bucket") {
				return (
					<span className="grid gap-0.5">
						<span>{label}</span>
						<span className="font-normal text-muted-foreground">
							{projectsIncomplete ? PROJECTED_BUCKET_NOTE : INCOMPLETE_BUCKET_NOTE}
						</span>
					</span>
				);
			}
			return label;
		},
		[resolution, labelMode, lastIncompleteT, tooltipLabelFormatter, projectsIncomplete],
	);

	if (data.length === 0) {
		return (
			<div
				className={`flex items-center justify-center text-sm text-muted-foreground ${heightClass}`}
			>
				No data available.
			</div>
		);
	}

	const tooltip = (
		<ChartTooltip
			content={({ active, payload, label }) => {
				const mergedPayload = mergeProjectedTooltipPayload(payload);
				const row = mergedPayload?.[0]?.payload as AnalyticsDatum | undefined;
				const showProjectedValues =
					projectsIncomplete && !!row && row.t === lastIncompleteT;
				return (
					<ChartTooltipContent
						active={active}
						payload={mergedPayload}
						label={label}
						indicator="line"
						labelFormatter={(_label: ReactNode, items: ReadonlyArray<{ payload?: unknown }>) => {
							const entry = items?.[0]?.payload as { t?: number } | undefined;
							return typeof entry?.t === "number" ? formatTooltipLabel(entry.t) : "";
						}}
						valueFormatter={(value, name) => {
							const actual =
								typeof value === "number" ? value : Number(value);
							if (!Number.isFinite(actual)) return formatTick(Number(value) || 0);
							if (!showProjectedValues || !row) return formatTick(actual);
							const seriesItem =
								visibleSeries.find((s) => s.label === name) ??
								series.find((s) => s.label === name || s.key === name);
							if (!seriesItem) return formatTick(actual);
							const projected = row[seriesItem.key];
							if (typeof projected !== "number" || projected === actual) {
								return formatTick(actual);
							}
							return (
								<span className="inline-flex items-center gap-1">
									<span>{formatTick(actual)}</span>
									<span className="font-sans font-normal text-muted-foreground">→</span>
									<span className="text-muted-foreground">{formatTick(projected)}</span>
								</span>
							);
						}}
					/>
				);
			}}
		/>
	);

	const sharedAxes = (
		<>
			<CartesianGrid stroke="var(--color-border)" strokeOpacity={0.5} vertical={false} />
			<XAxis
				dataKey="t"
				tickLine={false}
				axisLine={false}
				tickMargin={8}
				tickFormatter={(v: string | number) => xAxisFormatter(Number(v))}
				minTickGap={32}
				tick={{ fontSize: 12 }}
			/>
			<YAxis
				tickLine={false}
				axisLine={false}
				orientation="right"
				tickMargin={6}
				tickFormatter={(v: string | number) => formatTick(Number(v))}
				tick={{ fontSize: 12 }}
				width={56}
			/>
		</>
	);

	const watermark = <ChartWatermark />;

	const legend =
		interactiveLegend && series.length > 1 ? (
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pb-2 text-xs">
				{series.map((s) => {
					const hidden = hiddenKeys.has(s.key);
					return (
						<button
							key={s.key}
							type="button"
							onClick={() => {
								posthog.capture("chart_series_toggled", {
									series_key: s.key,
									visible: hidden,
								});
								toggleKey(s.key);
							}}
							aria-pressed={!hidden}
							className={`flex items-center gap-1.5 rounded-sm font-medium text-muted-foreground transition-opacity hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
								hidden ? "opacity-40" : "opacity-100"
							}`}
						>
							<span
								className="block h-2.5 w-2.5 rounded-[2px]"
								style={{ backgroundColor: s.color }}
							/>
							<span className={hidden ? "line-through" : undefined}>{s.label}</span>
						</button>
					);
				})}
			</div>
		) : null;

	const shimmerDefs = showShimmer ? (
		<defs>
			{visibleSeries.map((s) => {
				const id = `${gradientPrefix}-shimmer-${s.key}`;
				return (
					<pattern
						key={id}
						id={id}
						patternUnits="userSpaceOnUse"
						width="6"
						height="6"
						patternTransform="rotate(-45)"
					>
						<rect width="6" height="6" fill={s.color} />
						<rect
							width="3"
							height="6"
							fill="var(--color-background)"
							fillOpacity="0.55"
						/>
					</pattern>
				);
			})}
		</defs>
	) : null;

	const chartInner =
		variant === "bar" ? (
			<ChartContainer config={chartConfig} className="absolute inset-0 h-full w-full">
				<BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
					{shimmerDefs}
					{sharedAxes}
					{tooltip}
					{projectsIncomplete
						? visibleSeries.map((s) => (
								<Bar
									key={`${s.key}__actual`}
									dataKey={`${s.key}__actual`}
									name={s.label}
									fill={s.color}
									stackId={s.stackId ?? s.key}
									radius={0}
									legendType="none"
									{...(shareMode ? { isAnimationActive: false } : {})}
								/>
							))
						: null}
					{projectsIncomplete
						? visibleSeries.map((s, idx) => {
								const isLast = idx === visibleSeries.length - 1;
								return (
									<Bar
										key={`${s.key}__proj`}
										dataKey={`${s.key}__proj`}
										name={s.label}
										fill={s.color}
										fillOpacity={0.35}
										stackId={s.stackId ?? s.key}
										radius={s.stackId && !isLast ? 0 : [2, 2, 0, 0]}
										tooltipType="none"
										legendType="none"
										{...(shareMode ? { isAnimationActive: false } : {})}
									>
										{showShimmer
											? chartData.map((d) => (
													<Cell
														key={d.t}
														fill={
															d.t === lastIncompleteT
																? `url(#${gradientPrefix}-shimmer-${s.key})`
																: s.color
														}
														fillOpacity={d.t === lastIncompleteT ? 0.45 : 0}
													/>
												))
											: null}
									</Bar>
								);
							})
						: visibleSeries.map((s, idx) => {
								const isLast = idx === visibleSeries.length - 1;
								return (
									<Bar
										key={s.key}
										dataKey={s.key}
										name={s.label}
										fill={s.color}
										stackId={s.stackId}
										radius={s.stackId && !isLast ? 0 : [2, 2, 0, 0]}
										{...(shareMode ? { isAnimationActive: false } : {})}
									>
										{showShimmer
											? chartData.map((d) => (
													<Cell
														key={d.t}
														fill={
															d.t === lastIncompleteT
																? `url(#${gradientPrefix}-shimmer-${s.key})`
																: s.color
														}
													/>
												))
											: null}
									</Bar>
								);
							})}
				</BarChart>
			</ChartContainer>
		) : (
			<ChartContainer config={chartConfig} className="absolute inset-0 h-full w-full">
				<AreaChart data={areaData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
					<defs>
						{visibleSeries.map((s) => {
							const id = `${gradientPrefix}-${s.key}`;
							return (
								<linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
									<stop offset="100%" stopColor={s.color} stopOpacity={0} />
								</linearGradient>
							);
						})}
					</defs>
					{sharedAxes}
					{tooltip}
					{showShimmer
						? visibleSeries.flatMap((s) => [
								<Area
									key={`${s.key}__ghost`}
									type="monotone"
									dataKey={s.key}
									name={s.label}
									stroke="transparent"
									fill="none"
									activeDot={false}
									legendType="none"
									isAnimationActive={false}
								/>,
								<Area
									key={`${s.key}__tail`}
									type="monotone"
									dataKey={`${s.key}__tail`}
									stroke={s.color}
									strokeWidth={2}
									strokeDasharray="4 4"
									strokeOpacity={projectsIncomplete ? 0.45 : 1}
									fill={`url(#${gradientPrefix}-${s.key})`}
									fillOpacity={projectsIncomplete ? 0.25 : 0.5}
									connectNulls={false}
									tooltipType="none"
									legendType="none"
									isAnimationActive={false}
								/>,
							])
						: null}
					{visibleSeries.map((s) => (
						<Area
							key={s.key}
							type="monotone"
							dataKey={showShimmer ? `${s.key}__solid` : s.key}
							name={showShimmer ? undefined : s.label}
							stroke={s.color}
							strokeWidth={2}
							fill={`url(#${gradientPrefix}-${s.key})`}
							stackId={s.stackId}
							connectNulls={false}
							tooltipType={showShimmer ? "none" : undefined}
							legendType={showShimmer ? "none" : undefined}
							{...(shareMode ? { isAnimationActive: false } : {})}
						/>
					))}
				</AreaChart>
			</ChartContainer>
		);

	return (
		<div
			className={cn(
				className,
				"min-w-0",
				"group-data-[share-mode=image]/share-card:flex group-data-[share-mode=image]/share-card:h-full group-data-[share-mode=image]/share-card:min-h-0 group-data-[share-mode=image]/share-card:flex-col",
			)}
		>
			{legend}
			<div className={`relative ${heightClass}`}>
				{watermark}
				{chartInner}
			</div>
		</div>
	);
}
