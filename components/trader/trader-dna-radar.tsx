"use client";

import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

import type { TraderAxis } from "@/lib/polymarket/trader-archetype";
import { PEER_BASELINE_SCORE } from "@/lib/polymarket/trader-archetype";

type RadarRow = {
	axisId: string;
	label: string;
	trader: number;
	peer: number;
	rawLabel: string;
};

type TraderDnaRadarProps = {
	axes: TraderAxis[];
};

function buildRows(axes: TraderAxis[]): RadarRow[] {
	return axes.map((axis) => ({
		axisId: axis.id,
		label: axis.label,
		trader: axis.score,
		peer: PEER_BASELINE_SCORE,
		rawLabel: axis.rawLabel,
	}));
}

type RadarTooltipProps = {
	active?: boolean;
	payload?: ReadonlyArray<{ payload?: RadarRow }>;
};

function RadarTooltip({ active, payload }: RadarTooltipProps) {
	if (!active || !payload?.length) return null;
	const row = payload[0]?.payload;
	if (!row) return null;
	return (
		<div className="rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs shadow-xl">
			<p className="font-medium text-foreground">{row.label}</p>
			<p className="mt-0.5 text-muted-foreground">
				<span className="font-mono tabular-nums text-foreground">{row.rawLabel}</span>
				<span className="mx-1.5 text-muted-foreground/60">·</span>
				<span className="font-mono tabular-nums">{Math.round(row.trader)}/100</span>
			</p>
		</div>
	);
}

export function TraderDnaRadar({ axes }: TraderDnaRadarProps) {
	const data = buildRows(axes);
	return (
		<div className="relative aspect-square w-full">
			<ResponsiveContainer width="100%" height="100%">
				<RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
					<PolarGrid
						stroke="var(--border)"
						strokeOpacity={0.6}
						gridType="polygon"
					/>
					<PolarAngleAxis
						dataKey="label"
						tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
						tickLine={false}
						stroke="var(--border)"
					/>
					<PolarRadiusAxis
						domain={[0, 100]}
						tick={false}
						axisLine={false}
						tickCount={5}
					/>
					<Radar
						name="Peer median"
						dataKey="peer"
						stroke="var(--muted-foreground)"
						strokeDasharray="4 3"
						strokeOpacity={0.7}
						fill="var(--muted-foreground)"
						fillOpacity={0.08}
						isAnimationActive={false}
					/>
					<Radar
						name="Trader"
						dataKey="trader"
						stroke="var(--chart-3)"
						strokeWidth={2}
						fill="var(--chart-3)"
						fillOpacity={0.35}
						isAnimationActive={false}
					/>
					<Tooltip content={<RadarTooltip />} cursor={false} />
				</RadarChart>
			</ResponsiveContainer>
		</div>
	);
}
