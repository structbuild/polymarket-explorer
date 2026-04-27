"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import type { ConcentrationResponse } from "@structbuild/sdk";

import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";

type BarSlice = {
	id: string;
	label: string;
	description: string;
	sharePct: number;
	volumeUsd: number;
};

const CHART_CONFIG = {
	sharePct: { label: "Share", color: "var(--primary)" },
} satisfies ChartConfig;

const CHART_HEIGHT_PX = 320;

function buildBars(data: ConcentrationResponse): BarSlice[] {
	const cumShareAt = (rank: number, share: number) =>
		data.total_traders >= rank ? Math.min(Math.max(share, 0), 1) : 1;
	const cumVolAt = (rank: number, volume: number) =>
		data.total_traders >= rank
			? Math.min(Math.max(volume, 0), data.total_volume_usd)
			: data.total_volume_usd;

	const cumulative = [
		{ id: "top1", label: "Top 1", description: "Highest-volume trader", cumShare: cumShareAt(1, data.top1_share), cumVol: cumVolAt(1, data.top1_volume_usd) },
		{ id: "top10", label: "2–10", description: "Traders ranked 2 through 10", cumShare: cumShareAt(10, data.top10_share), cumVol: cumVolAt(10, data.top10_volume_usd) },
		{ id: "top100", label: "11–100", description: "Traders ranked 11 through 100", cumShare: cumShareAt(100, data.top100_share), cumVol: cumVolAt(100, data.top100_volume_usd) },
		{ id: "top1k", label: "101–1k", description: "Traders ranked 101 through 1,000", cumShare: cumShareAt(1_000, data.top1k_share), cumVol: cumVolAt(1_000, data.top1k_volume_usd) },
		{ id: "top10k", label: "1k–10k", description: "Traders ranked 1,001 through 10,000", cumShare: cumShareAt(10_000, data.top10k_share), cumVol: cumVolAt(10_000, data.top10k_volume_usd) },
		{ id: "rest", label: "Rest", description: "All remaining traders", cumShare: 1, cumVol: data.total_volume_usd },
	];

	let prevShare = 0;
	let prevVol = 0;
	return cumulative.map((t) => {
		const sharePct = Math.max(0, t.cumShare - prevShare) * 100;
		const volumeUsd = Math.max(0, t.cumVol - prevVol);
		prevShare = t.cumShare;
		prevVol = t.cumVol;
		return { id: t.id, label: t.label, description: t.description, sharePct, volumeUsd };
	});
}

type BuilderConcentrationCardProps = {
	data: ConcentrationResponse | null;
};

export function BuilderConcentrationCard({ data }: BuilderConcentrationCardProps) {
	const bars = useMemo(() => (data ? buildBars(data) : []), [data]);

	if (!data || data.total_traders === 0) {
		return (
			<Card variant="analytics" className="h-full">
				<CardContent className="text-sm text-muted-foreground">
					No concentration data available for this window.
				</CardContent>
			</Card>
		);
	}

	return (
		<Card variant="analytics" className="h-full">
			<CardContent className="space-y-4">
				<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<div className="flex items-center gap-1.5">
						<h3 className="text-sm font-medium text-muted-foreground">Trader concentration</h3>
						<InfoTooltip content="Share of volume from each trader-rank tier; slices are disjoint and sum to 100%." />
					</div>
					<p className="text-sm text-muted-foreground">
						<span className="text-foreground tabular-nums">
							{formatNumber(data.total_traders, { compact: true })}
						</span>{" "}
						traders ·{" "}
						<span className="text-foreground tabular-nums">
							{formatNumber(data.total_volume_usd, { compact: true, currency: true })}
						</span>{" "}
						volume
					</p>
				</div>

				<ChartContainer
					config={CHART_CONFIG}
					className="aspect-auto w-full"
					style={{ height: CHART_HEIGHT_PX }}
				>
					<BarChart data={bars} margin={{ left: 4, right: 12, top: 16, bottom: 0 }}>
						<CartesianGrid stroke="var(--color-border)" strokeOpacity={0.5} vertical={false} />
						<XAxis
							dataKey="label"
							type="category"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tick={{ fontSize: 12 }}
						/>
						<YAxis
							type="number"
							domain={[0, "auto"]}
							tickLine={false}
							axisLine={false}
							orientation="right"
							tickMargin={6}
							tickFormatter={(v: number) => `${v}%`}
							tick={{ fontSize: 12 }}
							width={40}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									indicator="line"
									labelFormatter={(_label, payload) => {
										const slice = payload?.[0]?.payload as BarSlice | undefined;
										return slice?.label ?? "";
									}}
									formatter={(_value, _name, item) => {
										const payload = item?.payload as BarSlice | undefined;
										if (!payload) return null;
										return (
											<div className="grid min-w-56 gap-2">
												<div>
													<div className="font-medium text-foreground">{payload.label}</div>
													<div className="text-muted-foreground">{payload.description}</div>
												</div>
												<div className="grid gap-1">
													<div className="flex items-center justify-between gap-4">
														<span className="text-muted-foreground">Volume share</span>
														<span className="font-mono font-medium tabular-nums text-foreground">
															{formatNumber(payload.sharePct, { decimals: 1, percent: true })}
														</span>
													</div>
													<div className="flex items-center justify-between gap-4">
														<span className="text-muted-foreground">Routed volume</span>
														<span className="font-mono font-medium tabular-nums text-foreground">
															{formatNumber(payload.volumeUsd, { compact: true, currency: true })}
														</span>
													</div>
													<span className="text-muted-foreground">
														Slices are disjoint, so tiers add up to 100%.
													</span>
												</div>
											</div>
										);
									}}
								/>
							}
						/>
						<Bar dataKey="sharePct" fill="var(--color-sharePct)" radius={[3, 3, 0, 0]}>
							<LabelList
								dataKey="sharePct"
								position="top"
								offset={6}
								className="fill-muted-foreground tabular-nums"
								fontSize={11}
								formatter={(value) => {
									const n = Number(value);
									return n > 0 ? formatNumber(n, { decimals: 1, percent: true }) : "";
								}}
							/>
						</Bar>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
