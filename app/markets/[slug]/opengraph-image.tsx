import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import type { PositionChartDataPoint } from "@structbuild/sdk";
import { formatDateShort, formatNumber } from "@/lib/format";
import { getMarketBySlug, getMarketChart } from "@/lib/struct/market-queries";
import { loadImageAsDataUrl, ogImageSize, ogPalette, OgStatItem } from "@/lib/opengraph";

export const runtime = "nodejs";
export const revalidate = 7200;
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Polymarket market prediction preview";

type Props = {
	params: Promise<{ slug: string }>;
};

type ChartGeometry = {
	areaPath: string;
	linePath: string;
	minLabel: string;
	maxLabel: string;
	lastPoint: { x: number; y: number; value: number };
};

function getStatusBadgeStyle(status: string) {
	if (status === "active") {
		return { color: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.2)" };
	}
	if (status === "closed" || status === "resolved") {
		return { color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.2)" };
	}
	return { color: ogPalette.foreground, backgroundColor: ogPalette.muted };
}

function getStatusLabel(status: string) {
	if (status === "active") return "Active";
	return status.charAt(0).toUpperCase() + status.slice(1);
}

function samplePoints(points: PositionChartDataPoint[], maxPoints: number) {
	if (points.length <= maxPoints) {
		return points;
	}

	const lastIndex = points.length - 1;
	const step = lastIndex / (maxPoints - 1);
	const sampled: PositionChartDataPoint[] = [];
	let previousIndex = -1;

	for (let i = 0; i < maxPoints; i += 1) {
		const nextIndex = i === maxPoints - 1 ? lastIndex : Math.round(i * step);

		if (nextIndex === previousIndex) {
			continue;
		}

		sampled.push(points[nextIndex]);
		previousIndex = nextIndex;
	}

	return sampled;
}

function buildChartGeometry(points: PositionChartDataPoint[]): ChartGeometry | null {
	const sampled = samplePoints(points, 80);

	if (sampled.length < 2) {
		return null;
	}

	const width = 1088;
	const height = 280;
	const inset = 14;
	const values = sampled.map((point) => point.v * 100);
	const minValue = Math.min(...values);
	const maxValue = Math.max(...values);
	const span = maxValue - minValue || 1;
	const firstX = inset;
	const lastX = width - inset;

	const xAt = (index: number) => {
		return firstX + ((lastX - firstX) * index) / (sampled.length - 1);
	};

	const yAt = (value: number) => {
		return inset + ((maxValue - value) * (height - inset * 2)) / span;
	};

	const linePath = sampled
		.map((point, index) => {
			const command = index === 0 ? "M" : "L";
			return `${command} ${xAt(index).toFixed(2)} ${yAt(point.v * 100).toFixed(2)}`;
		})
		.join(" ");
	const bottomY = height - inset;
	const areaPath = `${linePath} L ${lastX.toFixed(2)} ${bottomY.toFixed(2)} L ${firstX.toFixed(2)} ${bottomY.toFixed(2)} Z`;
	const lastValue = sampled[sampled.length - 1].v * 100;

	return {
		areaPath,
		linePath,
		minLabel: `${minValue.toFixed(0)}%`,
		maxLabel: `${maxValue.toFixed(0)}%`,
		lastPoint: {
			x: xAt(sampled.length - 1),
			y: yAt(lastValue),
			value: lastValue,
		},
	};
}

export default async function OpenGraphImage({ params }: Props) {
	const { slug } = await params;
	const market = await getMarketBySlug(slug);

	if (!market) {
		notFound();
	}

	const question = market.question ?? market.title ?? slug;
	const status = market.status ?? "unknown";
	const metricsLifetime = market.metrics?.["lifetime"];
	const volume = formatNumber(metricsLifetime?.volume ?? 0, { compact: true, currency: true });
	const txns = formatNumber(metricsLifetime?.txns ?? 0, { decimals: 0 });
	const traders = formatNumber(metricsLifetime?.unique_traders ?? 0, { decimals: 0 });
	const fees = formatNumber(metricsLifetime?.fees ?? 0, { compact: true, currency: true });
	const endDate = formatDateShort(market.end_time);

	const outcomes = market.outcomes ?? [];
	const isResolved = status === "resolved";
	const displayOutcome = isResolved ? market.winning_outcome ?? outcomes[0] : outcomes[0];
	const primaryOutcome = outcomes[0];
	const probability = primaryOutcome?.price ?? 0;
	const probabilityPct = `${(probability * 100).toFixed(0)}%`;

	const [imageDataUrl, chartOutcomes] = await Promise.all([loadImageAsDataUrl(market.image_url, 192), getMarketChart(market.condition_id)]);

	const primaryChartOutcome = chartOutcomes?.find((o) => o.outcome_index === (primaryOutcome?.outcome_index ?? 0)) ?? chartOutcomes?.[0];
	const chart = primaryChartOutcome ? buildChartGeometry(primaryChartOutcome.data ?? []) : null;

	return new ImageResponse(
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				padding: 28,
				gap: 14,
				background: ogPalette.background,
				color: ogPalette.foreground,
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					borderRadius: 16,
					background: ogPalette.card,
					padding: "24px 28px",
					width: "100%",
					gap: 16,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 20,
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 20,
							flex: 1,
							minWidth: 0,
						}}
					>
						{imageDataUrl && (
							<div
								style={{
									display: "flex",
									width: 96,
									height: 96,
									borderRadius: 12,
									overflow: "hidden",
									border: "2px solid rgba(255, 255, 255, 0.12)",
									flexShrink: 0,
								}}
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={imageDataUrl} width={96} height={96} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12 }} />
							</div>
						)}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
								minWidth: 0,
								gap: 6,
							}}
						>
							<div
								style={{
									display: "flex",
									fontSize: 28,
									fontWeight: 600,
									lineHeight: 1.3,
									maxWidth: 820,
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{question}
							</div>
						</div>
					</div>
					{displayOutcome && (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-end",
								flexShrink: 0,
							}}
						>
							<div
								style={{
									display: "flex",
									fontSize: 48,
									fontWeight: 700,
									lineHeight: 1,
									marginTop: 6,
									color: ogPalette.chartLine,
								}}
							>
								{isResolved ? displayOutcome.name : probabilityPct}
							</div>
						</div>
					)}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					flex: 1,
					flexDirection: "column",
					borderRadius: 16,
					background: ogPalette.card,
					padding: "20px 24px",
				}}
			>
				{chart ? (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							flex: 1,
						}}
					>
						<svg viewBox="0 0 1088 280" width="1088" height="280">
							<path d={chart.areaPath} fill={ogPalette.chartArea} />
							<path d={chart.linePath} fill="none" stroke={ogPalette.chartLine} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
							<circle cx={chart.lastPoint.x} cy={chart.lastPoint.y} r="7" fill={ogPalette.chartLine} stroke="#ffffff" strokeWidth="2.5" />
						</svg>
					</div>
				) : (
					<div
						style={{
							display: "flex",
							flex: 1,
							alignItems: "center",
							justifyContent: "center",
							borderRadius: 12,
							border: `1px dashed ${ogPalette.cardBorder}`,
							fontSize: 18,
							color: ogPalette.mutedForeground,
						}}
					>
						Probability chart unavailable
					</div>
				)}
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "row",
					borderRadius: 16,
					background: ogPalette.card,
					padding: "16px 28px",
					width: "100%",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						gap: 16,
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "row",
							gap: 32,
						}}
					>
						<OgStatItem label="Volume" value={volume} />
						<OgStatItem label="Txns" value={txns} />
						<OgStatItem label="Traders" value={traders} />
						<OgStatItem label="Fees" value={fees} />
						<OgStatItem label="End Date" value={endDate} />
					</div>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						padding: "6px 14px",
						borderRadius: 999,
						fontSize: 14,
						fontWeight: 600,
						...getStatusBadgeStyle(status),
					}}
				>
					{getStatusLabel(status)}
				</div>
			</div>
		</div>,
		size,
	);
}
