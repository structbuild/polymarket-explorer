import type { PositionChartOutcome } from "@structbuild/sdk";
import { getMarketChart } from "@/lib/struct/market-queries";

const COLORS = [
	{ stroke: "#10b981", fill: "rgba(16, 185, 129, 0.08)" },
	{ stroke: "#ef4444", fill: "rgba(239, 68, 68, 0.08)" },
	{ stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.08)" },
	{ stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.08)" },
	{ stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.08)" },
];

function buildChartPath(data: { t: number; v: number }[]) {
	if (data.length < 2) return null;

	const width = 700;
	const height = 220;
	const paddingX = 0;
	const paddingTop = 8;
	const paddingBottom = 8;

	const minT = data[0].t;
	const maxT = data[data.length - 1].t;
	const tRange = maxT - minT || 1;

	const values = data.map((d) => d.v);
	const minV = Math.min(...values);
	const maxV = Math.max(...values);
	const vRange = maxV - minV || 0.01;

	const xAt = (t: number) =>
		paddingX + ((t - minT) / tRange) * (width - paddingX * 2);
	const yAt = (v: number) =>
		paddingTop + ((maxV - v) / vRange) * (height - paddingTop - paddingBottom);

	const sampled =
		data.length > 120
			? data.filter(
					(_, i) =>
						i === 0 ||
						i === data.length - 1 ||
						i % Math.ceil(data.length / 120) === 0,
				)
			: data;

	const linePath = sampled
		.map((point, i) => {
			const cmd = i === 0 ? "M" : "L";
			return `${cmd} ${xAt(point.t).toFixed(2)} ${yAt(point.v).toFixed(2)}`;
		})
		.join(" ");

	const lastX = xAt(sampled[sampled.length - 1].t);
	const firstX = xAt(sampled[0].t);
	const areaPath = `${linePath} L ${lastX.toFixed(2)} ${(height - paddingBottom).toFixed(2)} L ${firstX.toFixed(2)} ${(height - paddingBottom).toFixed(2)} Z`;

	return { linePath, areaPath, width, height, minV, maxV };
}

function ProbabilityChart({
	chartData,
}: {
	chartData: PositionChartOutcome[];
}) {
	const primaryOutcome = chartData[0];
	if (!primaryOutcome?.data?.length) {
		return (
			<div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
				No chart data available
			</div>
		);
	}

	const chart = buildChartPath(primaryOutcome.data);
	if (!chart) return null;

	const gridLines = [0.25, 0.5, 0.75];
	const vRange = chart.maxV - chart.minV || 0.01;

	return (
		<div className="space-y-3">
			<div className="relative">
				<svg
					viewBox={`0 0 ${chart.width} ${chart.height}`}
					className="h-[220px] w-full"
					preserveAspectRatio="none"
				>
					{gridLines.map((pct) => {
						const v = chart.minV + vRange * pct;
						if (v < chart.minV || v > chart.maxV) return null;
						const y = 8 + ((chart.maxV - v) / vRange) * (chart.height - 16);
						return (
							<line
								key={pct}
								x1={0}
								y1={y}
								x2={chart.width}
								y2={y}
								stroke="currentColor"
								strokeOpacity={0.06}
								strokeWidth={1}
								vectorEffect="non-scaling-stroke"
							/>
						);
					})}

					{chartData.map((outcome, idx) => {
						const paths = buildChartPath(outcome.data);
						if (!paths) return null;
						const color = COLORS[idx % COLORS.length];
						return (
							<g key={outcome.outcome_index}>
								<path d={paths.areaPath} fill={color.fill} />
								<path
									d={paths.linePath}
									fill="none"
									stroke={color.stroke}
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									vectorEffect="non-scaling-stroke"
								/>
							</g>
						);
					})}
				</svg>

				<div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col justify-between py-2 text-[10px] font-mono text-muted-foreground/60">
					<span>{(chart.maxV * 100).toFixed(0)}%</span>
					<span>{(((chart.maxV + chart.minV) / 2) * 100).toFixed(0)}%</span>
					<span>{(chart.minV * 100).toFixed(0)}%</span>
				</div>
			</div>

			<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
				{chartData.map((outcome, idx) => {
					const color = COLORS[idx % COLORS.length];
					const lastPoint = outcome.data[outcome.data.length - 1];
					const currentValue = lastPoint ? `${(lastPoint.v * 100).toFixed(0)}%` : null;
					return (
						<span key={outcome.outcome_index} className="flex items-center gap-1.5">
							<span
								className="inline-block size-2 rounded-full"
								style={{ backgroundColor: color.stroke }}
							/>
							<span>{outcome.name}</span>
							{currentValue && (
								<span className="font-mono tabular-nums" style={{ color: color.stroke }}>
									{currentValue}
								</span>
							)}
						</span>
					);
				})}
			</div>
		</div>
	);
}

export async function MarketChart({ conditionId }: { conditionId: string }) {
	const chartData = await getMarketChart(conditionId);

	if (!chartData?.length) return null;

	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<h2 className="mb-4 text-sm font-medium text-muted-foreground">
				Probability History
			</h2>
			<ProbabilityChart chartData={chartData} />
		</div>
	);
}

export function MarketChartFallback() {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<div className="mb-4 h-4 w-32 animate-pulse rounded bg-muted" />
			<div className="h-[220px] animate-pulse rounded-md bg-muted" />
		</div>
	);
}
