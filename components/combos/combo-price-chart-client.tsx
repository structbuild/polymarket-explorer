"use client";

import { useMemo, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { computeProbabilityYDomain } from "@/lib/chart-domain";
import { formatDateCompact, formatDateFull, formatTime } from "@/lib/format";

const COMBO_PRICE_COLOR = "#8b5cf6";

const CHART_CONFIG: ChartConfig = {
	price: {
		label: "Combo price",
		color: COMBO_PRICE_COLOR,
	},
};

export function ComboPriceChartClient({ data }: { data: { t: number; price: number }[] }) {
	const chartData = useMemo(
		() => data.map((point) => ({ t: Math.floor(point.t / 1000), price: point.price * 100 })),
		[data],
	);

	const yDomain = useMemo<[number, number]>(
		() => computeProbabilityYDomain(chartData, ["price"]),
		[chartData],
	);

	return (
		<ChartContainer config={CHART_CONFIG} className="h-[260px] min-h-[260px] w-full sm:h-[320px]">
			<AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
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
			</AreaChart>
		</ChartContainer>
	);
}
