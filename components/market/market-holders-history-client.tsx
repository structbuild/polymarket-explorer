"use client";

import { useMemo, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { formatDateCompact, formatDateFull, formatNumber } from "@/lib/format";

type HolderPoint = { t: number; h: number };

const chartConfig = {
	holders: { label: "Holders", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function MarketHoldersHistoryClient({ data }: { data: HolderPoint[] }) {
	const chartData = useMemo(() => data.map((p) => ({ t: p.t, holders: p.h })), [data]);

	return (
		<ChartContainer config={chartConfig} className="h-[260px] min-h-[260px] w-full sm:h-[420px]">
			<AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
				<defs>
					<linearGradient id="holdersFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="var(--color-holders)" stopOpacity={0.35} />
						<stop offset="95%" stopColor="var(--color-holders)" stopOpacity={0} />
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
					tickFormatter={(v: string | number) => formatNumber(Number(v), { compact: true, decimals: 0 })}
					tick={{ fontSize: 12 }}
					width={48}
					allowDecimals={false}
				/>
				<ChartTooltip
					content={
						<ChartTooltipContent
							labelFormatter={(_label: ReactNode, payload: ReadonlyArray<{ payload?: unknown }>) => {
								const entry = payload?.[0]?.payload as { t?: number } | undefined;
								return typeof entry?.t === "number" ? formatDateFull(entry.t) : "";
							}}
							formatter={(
								value: number | string | readonly (number | string)[] | undefined,
								name: number | string | undefined,
							) => (
								<span className="flex w-full items-center justify-between gap-4">
									<span className="text-muted-foreground capitalize">{name}</span>
									<span className="font-mono font-medium tabular-nums">
										{formatNumber(value as number, { decimals: 0 })}
									</span>
								</span>
							)}
						/>
					}
				/>
				<Area
					type="monotone"
					dataKey="holders"
					name="Holders"
					stroke="var(--color-holders)"
					fill="url(#holdersFill)"
					strokeWidth={2}
				/>
			</AreaChart>
		</ChartContainer>
	);
}
