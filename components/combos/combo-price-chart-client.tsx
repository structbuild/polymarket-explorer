"use client";

import { useMemo, type ReactNode } from "react";
import { Area, ComposedChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { computeProbabilityYDomain } from "@/lib/chart-domain";
import { formatDateCompact, formatDateFull, formatTime } from "@/lib/format";

const COMBO_PRICE_COLOR = "#8b5cf6";

const LEG_COLORS = [
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--chart-1)",
	"var(--muted-foreground)",
];

type ComboPricePoint = { t: number; price: number };

export type ComboLegSeries = { key: string; label: string; points: ComboPricePoint[] };

export function ComboPriceChartClient({
	data,
	legs = [],
}: {
	data: ComboPricePoint[];
	legs?: ComboLegSeries[];
}) {
	const chartData = useMemo(() => {
		const rows = new Map<number, Record<string, number>>();
		const rowFor = (t: number) => {
			const existing = rows.get(t);
			if (existing) return existing;
			const created: Record<string, number> = { t };
			rows.set(t, created);
			return created;
		};

		for (const point of data) {
			rowFor(Math.floor(point.t / 1000)).price = point.price * 100;
		}
		for (const leg of legs) {
			for (const point of leg.points) {
				rowFor(Math.floor(point.t / 1000))[leg.key] = point.price * 100;
			}
		}

		return Array.from(rows.values()).sort((a, b) => a.t - b.t);
	}, [data, legs]);

	const yDomain = useMemo<[number, number]>(
		() => computeProbabilityYDomain(chartData, ["price", ...legs.map((leg) => leg.key)]),
		[chartData, legs],
	);

	const chartConfig = useMemo<ChartConfig>(() => {
		const config: ChartConfig = {
			price: { label: "Combo price", color: COMBO_PRICE_COLOR },
		};
		legs.forEach((leg, index) => {
			config[leg.key] = { label: leg.label, color: LEG_COLORS[index % LEG_COLORS.length] };
		});
		return config;
	}, [legs]);

	return (
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
							labelFormatter={(_label: ReactNode, payload: ReadonlyArray<{ payload?: unknown }>) => {
								const entry = payload?.[0]?.payload as { t?: number } | undefined;
								if (typeof entry?.t !== "number") return "";
								const time = formatTime(entry.t);
								return time ? `${formatDateFull(entry.t)} · ${time}` : formatDateFull(entry.t);
							}}
							formatter={(
								value: number | string | readonly (number | string)[] | undefined,
								name: number | string | undefined,
							) => (
								<span className="flex w-full items-center justify-between gap-4">
									<span className="text-muted-foreground">{name}</span>
									<span className="font-mono font-medium tabular-nums">{(value as number).toFixed(1)}%</span>
								</span>
							)}
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
						isAnimationActive={false}
					/>
				))}
				<Area
					key="price"
					dataKey="price"
					name="Combo price"
					type="monotone"
					fill="url(#gradient-combo-price)"
					stroke={COMBO_PRICE_COLOR}
					strokeWidth={2}
					connectNulls
					isAnimationActive={false}
				/>
			</ComposedChart>
		</ChartContainer>
	);
}
