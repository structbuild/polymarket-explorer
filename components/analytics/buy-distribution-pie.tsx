"use client";

import { useCallback, useMemo, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { StructLogo } from "@/components/ui/svgs/struct-logo";
import { formatNumber } from "@/lib/format";
import {
	BUY_DIST_KEYS,
	BUY_DIST_LABELS,
	type AnalyticsPoint,
	type BuyDistributionKey,
} from "@/lib/struct/analytics-shared";

const BUCKET_COLORS: Record<BuyDistributionKey, string> = {
	buyDistUnder10: "#10b981",
	buyDist10to100: "#06b6d4",
	buyDist100to1k: "#3b82f6",
	buyDist1kTo10k: "#8b5cf6",
	buyDist10kTo50k: "#f59e0b",
	buyDistOver50k: "#ef4444",
};

const PIE_AREA_CLASS = "h-[172px] w-full sm:h-[232px]";

type BuyDistributionPieProps = {
	points: AnalyticsPoint[];
};

type BucketDatum = {
	key: BuyDistributionKey;
	label: string;
	value: number;
	color: string;
};

function aggregate(points: AnalyticsPoint[]): BucketDatum[] {
	const totals: Record<BuyDistributionKey, number> = {
		buyDistUnder10: 0,
		buyDist10to100: 0,
		buyDist100to1k: 0,
		buyDist1kTo10k: 0,
		buyDist10kTo50k: 0,
		buyDistOver50k: 0,
	};
	for (const p of points) {
		for (const k of BUY_DIST_KEYS) totals[k] += p[k];
	}
	return BUY_DIST_KEYS.map((key) => ({
		key,
		label: BUY_DIST_LABELS[key],
		value: totals[key],
		color: BUCKET_COLORS[key],
	}));
}

export function BuyDistributionPie({ points }: BuyDistributionPieProps) {
	const data = useMemo(() => aggregate(points), [points]);
	const grandTotal = useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data]);

	const [hiddenKeys, setHiddenKeys] = useState<Set<BuyDistributionKey>>(
		() => new Set(),
	);
	const toggleKey = useCallback((key: BuyDistributionKey) => {
		setHiddenKeys((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);

	const visibleData = useMemo(
		() => data.filter((d) => !hiddenKeys.has(d.key)),
		[data, hiddenKeys],
	);
	const visibleTotal = useMemo(
		() => visibleData.reduce((acc, d) => acc + d.value, 0),
		[visibleData],
	);

	const chartConfig = useMemo<ChartConfig>(() => {
		const config: ChartConfig = {};
		for (const d of data) config[d.key] = { label: d.label, color: d.color };
		return config;
	}, [data]);

	if (grandTotal === 0) {
		return (
			<div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground sm:h-[300px]">
				No data available.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<div className={`relative ${PIE_AREA_CLASS}`}>
				<StructLogo
					aria-hidden
					className="pointer-events-none absolute left-1/2 top-1/2 h-10 -translate-x-1/2 -translate-y-1/2 text-foreground opacity-[0.06] sm:h-12"
				/>
				<ChartContainer config={chartConfig} className="h-full w-full">
					<PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
						<ChartTooltip
							isAnimationActive={false}
							content={
								<ChartTooltipContent
									hideLabel
									formatter={(value, name) => {
										const numeric = value as number;
										const pct =
											visibleTotal > 0 ? (numeric / visibleTotal) * 100 : 0;
										return (
											<span className="flex w-full items-center justify-between gap-4">
												<span className="text-muted-foreground">{name}</span>
												<span className="font-mono font-medium tabular-nums">
													{formatNumber(numeric, { compact: true })}
													<span className="ml-2 text-muted-foreground">
														{pct.toFixed(1)}%
													</span>
												</span>
											</span>
										);
									}}
								/>
							}
						/>
						<Pie
							data={visibleData}
							dataKey="value"
							nameKey="label"
							innerRadius="60%"
							outerRadius="90%"
							paddingAngle={1}
							strokeWidth={0}
							isAnimationActive={false}
						>
							{visibleData.map((d) => (
								<Cell key={d.key} fill={d.color} />
							))}
						</Pie>
					</PieChart>
				</ChartContainer>
				<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					<span className="text-xs text-muted-foreground">Total buys</span>
					<span className="font-mono text-lg font-medium tabular-nums">
						{formatNumber(visibleTotal, { compact: true })}
					</span>
				</div>
			</div>
			<ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
				{data.map((d) => {
					const hidden = hiddenKeys.has(d.key);
					const pct = visibleTotal > 0 ? (d.value / visibleTotal) * 100 : 0;
					return (
						<li key={d.key}>
							<button
								type="button"
								onClick={() => toggleKey(d.key)}
								aria-pressed={!hidden}
								className={`flex w-full items-center justify-between gap-2 rounded-sm text-left transition-opacity hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
									hidden ? "opacity-40" : "opacity-100"
								}`}
							>
								<span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
									<span
										aria-hidden
										className="block h-2 w-2 shrink-0 rounded-[2px]"
										style={{ backgroundColor: d.color }}
									/>
									<span
										className={`truncate font-medium text-foreground/90 ${
											hidden ? "line-through" : ""
										}`}
									>
										{d.label}
									</span>
								</span>
								<span className="font-mono tabular-nums text-muted-foreground">
									{hidden ? (
										"—"
									) : (
										<>
											{formatNumber(d.value, { compact: true })}
											<span className="ml-1.5 opacity-70">
												{pct.toFixed(1)}%
											</span>
										</>
									)}
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export function BuyDistributionPieFallback() {
	return (
		<div className="flex flex-col gap-3">
			<div className={`animate-pulse rounded-md bg-muted/60 ${PIE_AREA_CLASS}`} />
			<div className="grid grid-cols-2 gap-x-3 gap-y-1">
				{BUY_DIST_KEYS.map((k) => (
					<div key={k} className="h-4 w-full animate-pulse rounded bg-muted/60" />
				))}
			</div>
		</div>
	);
}
