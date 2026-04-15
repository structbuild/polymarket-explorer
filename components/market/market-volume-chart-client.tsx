"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDateCompact, formatDateFull, formatNumber } from "@/lib/format";

type VolumePoint = { t: number; buy: number; sell: number };

export type VolumeOutcome = {
	name: string;
	outcomeIndex: number;
	data: VolumePoint[];
};

type SeriesKey = "total" | "buy" | "sell";

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
	{ key: "total", label: "Total", color: "var(--chart-2)" },
	{ key: "buy", label: "Buys", color: "#10b981" },
	{ key: "sell", label: "Sells", color: "#ef4444" },
];

const OUTCOME_COLORS = [
	"#10b981",
	"#ef4444",
	"var(--chart-2)",
	"var(--chart-4)",
];

const chartConfig = {
	total: { label: "Total", color: "var(--chart-2)" },
	buy: { label: "Buys", color: "#10b981" },
	sell: { label: "Sells", color: "#ef4444" },
} satisfies ChartConfig;

export function MarketVolumeChartClient({ outcomes }: { outcomes: VolumeOutcome[] }) {
	const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<number>(outcomes[0].outcomeIndex);
	const [selectedSeries, setSelectedSeries] = useState<SeriesKey>("total");

	const activeOutcome =
		outcomes.find((o) => o.outcomeIndex === selectedOutcomeIndex) ?? outcomes[0];

	const chartData = useMemo(
		() =>
			activeOutcome.data.map((p) => ({
				t: p.t,
				total: p.buy + p.sell,
				buy: p.buy,
				sell: p.sell,
			})),
		[activeOutcome],
	);

	const activeSeries = SERIES.find((s) => s.key === selectedSeries) ?? SERIES[0];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				{outcomes.length > 1 && (
					<ToggleGroup
						value={[String(selectedOutcomeIndex)]}
						onValueChange={(value) => {
							const next = Array.isArray(value) ? value[0] : value;
							if (next) setSelectedOutcomeIndex(Number(next));
						}}
						variant="outline"
						size="sm"
						className="flex-wrap"
					>
						{outcomes.map((o, idx) => (
							<ToggleGroupItem
								key={o.outcomeIndex}
								value={String(o.outcomeIndex)}
								aria-label={o.name}
							>
								<span
									className="mr-1.5 inline-block size-2 rounded-full"
									style={{ backgroundColor: OUTCOME_COLORS[idx % OUTCOME_COLORS.length] }}
								/>
								{o.name}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
				)}
				<ToggleGroup
					value={[selectedSeries]}
					onValueChange={(value) => {
						const next = Array.isArray(value) ? value[0] : value;
						if (next) setSelectedSeries(next as SeriesKey);
					}}
					variant="outline"
					size="sm"
					className="flex-wrap"
				>
					{SERIES.map((s) => (
						<ToggleGroupItem key={s.key} value={s.key} aria-label={s.label}>
							<span className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: s.color }} />
							{s.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>
			<ChartContainer config={chartConfig} className="h-[260px] min-h-[260px] w-full sm:h-[320px]">
				<BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
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
						tickFormatter={(v: string | number) => formatNumber(Number(v), { compact: true, currency: true })}
						tick={{ fontSize: 12 }}
						width={56}
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								labelFormatter={(_label: ReactNode, payload: ReadonlyArray<{ payload?: unknown }>) => {
									const entry = payload?.[0]?.payload as { t?: number } | undefined;
									return entry?.t ? formatDateFull(entry.t) : "";
								}}
								formatter={(
									value: number | string | readonly (number | string)[] | undefined,
									name: number | string | undefined,
								) => (
									<span className="flex w-full items-center justify-between gap-4">
										<span className="text-muted-foreground capitalize">{name}</span>
										<span className="font-mono font-medium tabular-nums">
											{formatNumber(value as number, { currency: true, compact: true })}
										</span>
									</span>
								)}
							/>
						}
					/>
					{selectedSeries === "total" ? (
						<>
							<Bar dataKey="buy" name="Buys" stackId="v" fill="#10b981" />
							<Bar dataKey="sell" name="Sells" stackId="v" fill="#ef4444" radius={[2, 2, 0, 0]} />
						</>
					) : (
						<Bar dataKey={activeSeries.key} name={activeSeries.label} fill={activeSeries.color} radius={[2, 2, 0, 0]} />
					)}
				</BarChart>
			</ChartContainer>
		</div>
	);
}
