"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { PositionChartOutcome } from "@structbuild/sdk";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDateCompact, formatDateFull, formatTime } from "@/lib/format";

const OUTCOME_COLORS = [
	"#10b981",
	"#ef4444",
	"var(--chart-2)",
	"var(--chart-4)",
];

function outcomeKey(outcome: PositionChartOutcome) {
	return `o_${outcome.outcome_index}`;
}

export function MarketProbabilityChartClient({ outcomes }: { outcomes: PositionChartOutcome[] }) {
	const [selectedKey, setSelectedKey] = useState<string>(() => outcomeKey(outcomes[0]));

	const { data, config, keys } = useMemo(() => {
		const timestamps = new Set<number>();
		outcomes.forEach((o) => o.data.forEach((p) => timestamps.add(p.t)));
		const sortedTs = Array.from(timestamps).sort((a, b) => a - b);

		const outcomeMaps = outcomes.map((o) => {
			const m = new Map<number, number>();
			o.data.forEach((p) => m.set(p.t, p.v));
			return m;
		});

		const merged = sortedTs.map((t) => {
			const row: Record<string, number> = { t: Math.floor(t / 1000) };
			outcomes.forEach((o, idx) => {
				const v = outcomeMaps[idx].get(t);
				if (v != null) row[outcomeKey(o)] = v * 100;
			});
			return row;
		});

		const cfg: ChartConfig = {};
		outcomes.forEach((o, idx) => {
			cfg[outcomeKey(o)] = {
				label: o.name,
				color: OUTCOME_COLORS[idx % OUTCOME_COLORS.length],
			};
		});

		return {
			data: merged,
			config: cfg,
			keys: outcomes.map((o, idx) => ({
				key: outcomeKey(o),
				name: o.name,
				color: OUTCOME_COLORS[idx % OUTCOME_COLORS.length],
			})),
		};
	}, [outcomes]);

	const activeKey = keys.find((k) => k.key === selectedKey) ?? keys[0];

	const yDomain = useMemo<[number, number]>(() => {
		let min = Infinity;
		let max = -Infinity;
		for (const row of data) {
			const v = row[activeKey.key];
			if (typeof v === "number") {
				if (v < min) min = v;
				if (v > max) max = v;
			}
		}
		if (!isFinite(min) || !isFinite(max)) return [0, 100];

		const range = max - min;
		const pad = Math.max(range * 0.05, 2);
		const rawLow = min - pad;
		const rawHigh = max + pad;
		const step = range >= 40 ? 10 : range >= 20 ? 5 : range >= 10 ? 2 : 1;
		const low = Math.max(0, Math.floor(rawLow / step) * step);
		const high = Math.min(100, Math.ceil(rawHigh / step) * step);
		return [low, high === low ? Math.min(100, low + step) : high];
	}, [data, activeKey.key]);

	return (
		<div className="space-y-4">
			{keys.length > 1 && (
				<ToggleGroup
					value={[selectedKey]}
					onValueChange={(value) => {
						const next = Array.isArray(value) ? value[0] : value;
						if (next) setSelectedKey(next);
					}}
					variant="outline"
					size="sm"
					className="flex-wrap"
				>
					{keys.map((k) => (
						<ToggleGroupItem key={k.key} value={k.key} aria-label={k.name}>
							<span
								className="mr-1.5 inline-block size-2 rounded-full"
								style={{ backgroundColor: k.color }}
							/>
							{k.name}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			)}
			<ChartContainer config={config} className="h-[260px] min-h-[260px] w-full sm:h-[320px]">
				<AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
					<defs>
						<linearGradient id={`gradient-${activeKey.key}`} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={activeKey.color} stopOpacity={0.25} />
							<stop offset="100%" stopColor={activeKey.color} stopOpacity={0.02} />
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
									if (!entry?.t) return "";
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
						key={activeKey.key}
						dataKey={activeKey.key}
						name={activeKey.name}
						type="monotone"
						fill={`url(#gradient-${activeKey.key})`}
						stroke={activeKey.color}
						strokeWidth={2}
						connectNulls
						isAnimationActive={false}
					/>
				</AreaChart>
			</ChartContainer>
		</div>
	);
}
