"use client";

import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
} from "recharts";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { StructLogo } from "@/components/ui/svgs/struct-logo";
import {
	formatDateCompact,
	formatDateFull,
	formatDateTimeCompact,
	formatDateTimeFull,
	formatNumber,
	formatTimeCompact,
} from "@/lib/format";
import { useShareMode } from "@/lib/hooks/use-share-mode";
import { cn } from "@/lib/utils";

const SECONDS_PER_DAY = 86400;

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
};

export type AnalyticsValueFormat = "currency" | "count";

type AnalyticsDatum = { t: number } & Record<string, number>;

type AnalyticsChartProps = {
	data: AnalyticsDatum[];
	variant: "area" | "bar";
	series: AnalyticsSeries[];
	valueFormat: AnalyticsValueFormat;
	interactiveLegend?: boolean;
	className?: string;
};

const HEIGHT_CLASS =
	"h-[240px] min-h-[240px] w-full sm:h-[300px] group-data-[share-mode=image]/share-card:h-full group-data-[share-mode=image]/share-card:min-h-0 group-data-[share-mode=image]/share-card:flex-1";

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

export function AnalyticsChart({
	data,
	variant,
	series,
	valueFormat,
	interactiveLegend = false,
	className,
}: AnalyticsChartProps) {
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
			if (s.isTotal) hidden.add(s.key);
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
	const animationActive = !shareMode;

	const granularity = useMemo(() => detectGranularity(data), [data]);
	const xAxisFormatter = useMemo(() => {
		if (granularity === "intraday-short") return formatTimeCompact;
		if (granularity === "intraday") return formatDateTimeCompact;
		return formatDateCompact;
	}, [granularity]);
	const tooltipLabelFormatter = granularity === "daily" ? formatDateFull : formatDateTimeFull;

	if (data.length === 0) {
		return (
			<div
				className={`flex items-center justify-center text-sm text-muted-foreground ${HEIGHT_CLASS}`}
			>
				No data available.
			</div>
		);
	}

	const tooltip = (
		<ChartTooltip
			content={
				<ChartTooltipContent
					labelFormatter={(_label: ReactNode, payload: ReadonlyArray<{ payload?: unknown }>) => {
						const entry = payload?.[0]?.payload as { t?: number } | undefined;
						return typeof entry?.t === "number" ? tooltipLabelFormatter(entry.t) : "";
					}}
					formatter={(
						value: number | string | readonly (number | string)[] | undefined,
						name: number | string | undefined,
					) => (
						<span className="flex w-full items-center justify-between gap-4">
							<span className="text-muted-foreground">{name}</span>
							<span className="font-mono font-medium tabular-nums">
								{valueFormatter(value as number, valueFormat)}
							</span>
						</span>
					)}
				/>
			}
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
				tickFormatter={(v: string | number) => valueFormatter(Number(v), valueFormat)}
				tick={{ fontSize: 12 }}
				width={56}
			/>
		</>
	);

	const watermark = (
		<StructLogo
			aria-hidden
			className="pointer-events-none absolute left-1/2 top-1/2 h-10 -translate-x-1/2 -translate-y-1/2 text-foreground opacity-[0.06] sm:h-12"
		/>
	);

	const legend =
		interactiveLegend && series.length > 1 ? (
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pb-2 text-xs">
				{series.map((s) => {
					const hidden = hiddenKeys.has(s.key);
					return (
						<button
							key={s.key}
							type="button"
							onClick={() => toggleKey(s.key)}
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

	const chartInner =
		variant === "bar" ? (
			<ChartContainer config={chartConfig} className="h-full w-full">
				<BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
					{sharedAxes}
					{tooltip}
					{visibleSeries.map((s, idx) => {
						const isLast = idx === visibleSeries.length - 1;
						return (
							<Bar
								key={s.key}
								dataKey={s.key}
								name={s.label}
								fill={s.color}
								stackId={s.stackId}
								radius={s.stackId && !isLast ? 0 : [2, 2, 0, 0]}
								isAnimationActive={animationActive}
							/>
						);
					})}
				</BarChart>
			</ChartContainer>
		) : (
			<ChartContainer config={chartConfig} className="h-full w-full">
				<AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
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
					{visibleSeries.map((s) => (
						<Area
							key={s.key}
							type="monotone"
							dataKey={s.key}
							name={s.label}
							stroke={s.color}
							strokeWidth={2}
							fill={`url(#${gradientPrefix}-${s.key})`}
							stackId={s.stackId}
							isAnimationActive={animationActive}
						/>
					))}
				</AreaChart>
			</ChartContainer>
		);

	return (
		<div
			className={cn(
				className,
				"group-data-[share-mode=image]/share-card:flex group-data-[share-mode=image]/share-card:h-full group-data-[share-mode=image]/share-card:min-h-0 group-data-[share-mode=image]/share-card:flex-col",
			)}
		>
			{legend}
			<div className={`relative ${HEIGHT_CLASS}`}>
				{watermark}
				{chartInner}
			</div>
		</div>
	);
}
