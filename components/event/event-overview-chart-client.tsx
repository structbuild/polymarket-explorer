"use client";

import { useMemo, type ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import posthog from "posthog-js";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { EventMarketChartOutcome } from "@structbuild/sdk";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { formatDateCompact, formatDateFull, formatTime } from "@/lib/format";

const SERIES_COLORS = [
	"#10b981",
	"#3b82f6",
	"#f59e0b",
	"#ef4444",
];

function seriesKey(o: EventMarketChartOutcome) {
	return `m_${o.market_slug || o.condition_id}`;
}

function shorten(label: string, max: number = 36) {
	if (label.length <= max) return label;
	return `${label.slice(0, max - 1)}…`;
}

export function EventOverviewChartClient({ outcomes }: { outcomes: EventMarketChartOutcome[] }) {
	const filtered = useMemo(() => outcomes.filter((o) => (o.data?.length ?? 0) > 0), [outcomes]);

	const { data, config, keys } = useMemo(() => {
		const timestamps = new Set<number>();
		filtered.forEach((o) => o.data.forEach((p) => timestamps.add(p.t)));
		const sortedTs = Array.from(timestamps).sort((a, b) => a - b);

		const seriesSorted = filtered.map((o) =>
			[...o.data].sort((a, b) => a.t - b.t),
		);
		const pointers = filtered.map(() => 0);
		const lastValues: (number | undefined)[] = filtered.map(() => undefined);

		const merged = sortedTs.map((t) => {
			const row: Record<string, number> = { t: Math.floor(t / 1000) };
			filtered.forEach((o, idx) => {
				const points = seriesSorted[idx];
				while (pointers[idx] < points.length && points[pointers[idx]].t <= t) {
					lastValues[idx] = points[pointers[idx]].v;
					pointers[idx] += 1;
				}
				const carried = lastValues[idx];
				if (carried != null) {
					row[seriesKey(o)] = carried * 100;
				}
			});
			return row;
		});

		const cfg: ChartConfig = {};
		filtered.forEach((o, idx) => {
			cfg[seriesKey(o)] = {
				label: o.title || o.question,
				color: SERIES_COLORS[idx % SERIES_COLORS.length],
			};
		});

		return {
			data: merged,
			config: cfg,
			keys: filtered.map((o, idx) => ({
				key: seriesKey(o),
				name: o.title || o.question,
				slug: o.market_slug,
				color: SERIES_COLORS[idx % SERIES_COLORS.length],
			})),
		};
	}, [filtered]);

	if (keys.length === 0) {
		return (
			<div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground sm:h-[320px]">
				No probability data available.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<ChartContainer config={config} className="h-[260px] min-h-[260px] w-full sm:h-[320px]">
				<LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
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
						domain={[0, 100]}
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
					{keys.map((k) => (
						<Line
							key={k.key}
							dataKey={k.key}
							name={k.name}
							type="monotone"
							stroke={k.color}
							strokeWidth={2}
							dot={false}
							activeDot={{ r: 4 }}
							connectNulls
							isAnimationActive={false}
						/>
					))}
				</LineChart>
			</ChartContainer>

			<ul className="flex flex-wrap gap-2">
				{keys.map((k) => (
					<li key={k.key}>
						{k.slug ? (
							<Link
								href={`/markets/${k.slug}` as Route}
								prefetch={false}
								onClick={() => posthog.capture("event_chart_market_clicked", { market_slug: k.slug })}
								className="inline-flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs transition-colors hover:bg-accent"
								title={k.name}
							>
								<span
									className="size-2 rounded-full"
									style={{ backgroundColor: k.color }}
								/>
								<span className="text-foreground">{shorten(k.name)}</span>
							</Link>
						) : (
							<span className="inline-flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs">
								<span
									className="size-2 rounded-full"
									style={{ backgroundColor: k.color }}
								/>
								<span className="text-foreground">{shorten(k.name)}</span>
							</span>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
