"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Area, ComposedChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { computeProbabilityYDomain } from "@/lib/chart-domain";
import { formatDateCompact, formatDateFull, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const COMBO_PRICE_COLOR = "#8b5cf6";
const PRICE_KEY = "price";

const LEG_COLORS = [
	"#f59e0b",
	"#10b981",
	"#06b6d4",
	"#ec4899",
	"#f97316",
	"#22c55e",
];

type ComboPricePoint = { t: number; price: number };

function interpolateSeries(
	points: ReadonlyArray<ComboPricePoint>,
	timestamps: number[],
): Map<number, number> {
	const result = new Map<number, number>();
	if (points.length === 0) return result;
	const sorted = points
		.map((point) => ({ t: Math.floor(point.t / 1000), v: point.price * 100 }))
		.sort((a, b) => a.t - b.t);
	const first = sorted[0];
	const last = sorted[sorted.length - 1];
	let i = 0;
	for (const t of timestamps) {
		if (t < first.t || t > last.t) continue;
		while (i < sorted.length - 1 && sorted[i + 1].t <= t) i++;
		const cur = sorted[i];
		const next = sorted[i + 1];
		if (cur.t === t || !next) {
			result.set(t, cur.v);
			continue;
		}
		const frac = (t - cur.t) / (next.t - cur.t);
		result.set(t, cur.v + (next.v - cur.v) * frac);
	}
	return result;
}

export type ComboLegSeries = {
	key: string;
	label: string;
	points: ComboPricePoint[];
	outcome?: string | null;
};

export function ComboPriceChartClient({
	data,
	legs = [],
}: {
	data: ComboPricePoint[];
	legs?: ComboLegSeries[];
}) {
	const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());

	const toggle = (key: string) => {
		setHidden((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const legMetaByKey = useMemo(
		() => new Map(legs.map((leg) => [leg.key, leg])),
		[legs],
	);

	const legendItems = useMemo(
		() => [
			{ key: PRICE_KEY, label: "Combo price", color: COMBO_PRICE_COLOR },
			...legs.map((leg, index) => ({
				key: leg.key,
				label: leg.label,
				color: LEG_COLORS[index % LEG_COLORS.length],
			})),
		],
		[legs],
	);

	const chartData = useMemo(() => {
		const timestamps = new Set<number>();
		for (const point of data) timestamps.add(Math.floor(point.t / 1000));
		for (const leg of legs) {
			for (const point of leg.points) timestamps.add(Math.floor(point.t / 1000));
		}
		const sortedTs = Array.from(timestamps).sort((a, b) => a - b);

		const priceByT = interpolateSeries(data, sortedTs);
		const legByT = legs.map((leg) => [leg.key, interpolateSeries(leg.points, sortedTs)] as const);

		return sortedTs.map((t) => {
			const row: Record<string, number> = { t };
			const price = priceByT.get(t);
			if (price != null) row.price = price;
			for (const [key, series] of legByT) {
				const value = series.get(t);
				if (value != null) row[key] = value;
			}
			return row;
		});
	}, [data, legs]);

	const yDomain = useMemo<[number, number]>(() => {
		const visibleKeys = legendItems.map((item) => item.key).filter((key) => !hidden.has(key));
		const keys = visibleKeys.length > 0 ? visibleKeys : legendItems.map((item) => item.key);
		return computeProbabilityYDomain(chartData, keys);
	}, [chartData, legendItems, hidden]);

	const chartConfig = useMemo<ChartConfig>(() => {
		const config: ChartConfig = {};
		for (const item of legendItems) {
			config[item.key] = { label: item.label, color: item.color };
		}
		return config;
	}, [legendItems]);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap gap-x-3 gap-y-1.5">
				{legendItems.map((item) => {
					const isHidden = hidden.has(item.key);
					return (
						<button
							key={item.key}
							type="button"
							onClick={() => toggle(item.key)}
							aria-pressed={!isHidden}
							className={cn(
								"flex min-w-0 items-center gap-1.5 text-xs transition-opacity",
								isHidden ? "opacity-40" : "opacity-100",
							)}
						>
							<span
								className="size-2.5 shrink-0 rounded-[3px]"
								style={{ backgroundColor: item.color }}
							/>
							<span
								className={cn(
									"max-w-[180px] truncate",
									isHidden ? "text-muted-foreground line-through" : "text-foreground",
								)}
							>
								{item.label}
							</span>
						</button>
					);
				})}
			</div>
			<ChartContainer config={chartConfig} className="h-[260px] min-h-[260px] w-full sm:h-[320px]">
				<ComposedChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
				<defs>
					<linearGradient id="gradient-combo-price" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={COMBO_PRICE_COLOR} stopOpacity={0.25} />
						<stop offset="100%" stopColor={COMBO_PRICE_COLOR} stopOpacity={0.02} />
					</linearGradient>
				</defs>
				<CartesianGrid stroke="var(--color-border)" strokeOpacity={0.5} vertical={false} />
				<XAxis
					dataKey="t"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(v: string | number) => formatDateCompact(Number(v))}
					minTickGap={32}
					tick={{ fontSize: 12 }}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					orientation="right"
					tickMargin={6}
					tickFormatter={(v: string | number) => `${v}%`}
					tick={{ fontSize: 12 }}
					width={44}
					domain={yDomain}
				/>
				<ChartTooltip
					content={
						<ChartTooltipContent
							className="min-w-[220px] max-w-[320px]"
							labelFormatter={(_label: ReactNode, payload: ReadonlyArray<{ payload?: unknown }>) => {
								const entry = payload?.[0]?.payload as { t?: number } | undefined;
								if (typeof entry?.t !== "number") return "";
								const time = formatTime(entry.t);
								return time ? `${formatDateFull(entry.t)} · ${time}` : formatDateFull(entry.t);
							}}
							formatter={(
								value: number | string | readonly (number | string)[] | undefined,
								name: number | string | undefined,
								item?: { dataKey?: string | number | ((obj: unknown) => unknown); color?: string },
							) => {
								const dataKey = typeof item?.dataKey === "string" ? item.dataKey : "";
								const meta = legMetaByKey.get(dataKey);
								const label = meta ? meta.label : name;
								return (
									<span className="flex w-full items-center gap-2">
										<span
											className="size-2.5 shrink-0 rounded-[3px]"
											style={{ backgroundColor: item?.color }}
										/>
										<span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span>
										{meta?.outcome ? (
											<span className="shrink-0 text-[10px] uppercase text-muted-foreground/70">
												{meta.outcome}
											</span>
										) : null}
										<span className="font-mono font-medium tabular-nums">{(value as number).toFixed(1)}%</span>
									</span>
								);
							}}
						/>
					}
				/>
				{legs.map((leg) => (
					<Line
						key={leg.key}
						dataKey={leg.key}
						name={leg.label}
						type="monotone"
						stroke={`var(--color-${leg.key})`}
						strokeWidth={1}
						strokeOpacity={0.4}
						dot={false}
						activeDot={false}
						connectNulls
						hide={hidden.has(leg.key)}
						isAnimationActive={false}
					/>
				))}
				<Area
					key={PRICE_KEY}
					dataKey={PRICE_KEY}
					name="Combo price"
					type="monotone"
					fill="url(#gradient-combo-price)"
					stroke={COMBO_PRICE_COLOR}
					strokeWidth={2}
					connectNulls
					hide={hidden.has(PRICE_KEY)}
					isAnimationActive={false}
				/>
				</ComposedChart>
			</ChartContainer>
		</div>
	);
}
