"use client";

import type { CategoryEntry, PolymarketCategory } from "@structbuild/sdk";
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

import { formatNumber, readTotalPnlUsd } from "@/lib/format";

const CATEGORY_AXES: PolymarketCategory[] = [
	"Politics",
	"Sports",
	"Crypto",
	"Finance",
	"Culture",
	"Mentions",
	"Weather",
	"Economics",
	"Tech",
];

type RadarRow = {
	category: PolymarketCategory;
	volume: number;
	pnl: number;
};

type TraderCategoryRadarProps = {
	rows: CategoryEntry[];
};

const RADAR_INITIAL_DIMENSION = { width: 320, height: 320 } as const;

function buildData(rows: CategoryEntry[]): RadarRow[] {
	const lookup = new Map<string, CategoryEntry>(
		rows.map((row) => [String(row.category ?? "").toLowerCase(), row]),
	);

	return CATEGORY_AXES.map((category) => {
		const match = lookup.get(category.toLowerCase());
		return {
			category,
			volume: match?.total_volume_usd ?? 0,
			pnl: readTotalPnlUsd(match),
		};
	});
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
			<p className="font-medium text-foreground">{row.category}</p>
			<p className="mt-0.5 text-muted-foreground">
				<span className="text-foreground">Volume</span>{" "}
				<span className="font-mono tabular-nums text-foreground">
					{formatNumber(row.volume, { currency: true, compact: true })}
				</span>
			</p>
			<p className="mt-0.5 text-muted-foreground">
				<span className="text-foreground">PnL</span>{" "}
				<span className={`font-mono tabular-nums ${row.pnl > 0 ? "text-emerald-500" : row.pnl < 0 ? "text-red-500" : "text-muted-foreground"}`}>
					{formatNumber(row.pnl, { currency: true, compact: true })}
				</span>
			</p>
		</div>
	);
}

export function TraderCategoryRadar({ rows }: TraderCategoryRadarProps) {
	const data = buildData(rows);
	const hasData = data.some((row) => row.volume > 0);

	if (!hasData) {
		return (
			<div className="rounded-lg border bg-card px-4 py-12 text-center text-sm text-muted-foreground sm:px-6">
				No category activity to chart yet.
			</div>
		);
	}

	return (
		<div className="rounded-lg border bg-card p-4 sm:p-6">
			<p className="mb-3 text-sm text-foreground sm:text-base">Category mix</p>
			<div className="relative aspect-square w-full max-w-md min-w-0">
				<ResponsiveContainer
					width="100%"
					height="100%"
					initialDimension={RADAR_INITIAL_DIMENSION}
				>
					<RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
						<PolarGrid
							stroke="var(--border)"
							strokeOpacity={0.6}
							gridType="polygon"
						/>
						<PolarAngleAxis
							dataKey="category"
							tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
							tickLine={false}
							stroke="var(--border)"
						/>
						<PolarRadiusAxis
							tick={false}
							axisLine={false}
							tickCount={5}
						/>
						<Radar
							name="Volume"
							dataKey="volume"
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
		</div>
	);
}
