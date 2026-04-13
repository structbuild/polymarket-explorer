import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { loadTraderOpenGraphData } from "@/lib/trader-open-graph";
import type { PnlDataPoint } from "@/lib/polymarket/pnl";
import { formatDateShort, formatDuration, formatNumber } from "@/lib/format";
import { ogImageSize, ogPalette, OgStatItem } from "@/lib/opengraph";
import { normalizeWalletAddress, truncateAddress } from "@/lib/utils";

export const runtime = "nodejs";
export const revalidate = 7200;
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Polymarket trader lifetime performance preview";

type Props = {
	params: Promise<{ address: string }>;
};

type ChartGeometry = {
	areaPath: string;
	linePath: string;
	minLabel: string;
	maxLabel: string;
	lastPoint: { x: number; y: number; value: number };
	zeroY: number;
};


function stringHash(value: string) {
	let hash = 0;

	for (let index = 0; index < value.length; index += 1) {
		hash = (hash << 5) - hash + value.charCodeAt(index);
		hash &= hash;
	}

	return Math.abs(hash);
}

function RoundFace() {
	return (
		<svg aria-hidden="true" width="56" height="14" viewBox="0 0 63 15" xmlns="http://www.w3.org/2000/svg">
			<circle cx="7.2" cy="7.2" r="7.2" fill="#111827" />
			<circle cx="55.2" cy="7.2" r="7.2" fill="#111827" />
		</svg>
	);
}

function CrossFace() {
	return (
		<svg aria-hidden="true" width="56" height="18" viewBox="0 0 71 23" xmlns="http://www.w3.org/2000/svg">
			<rect x="0" y="8" width="23" height="7" rx="3.5" fill="#111827" />
			<rect x="8" y="0" width="7" height="23" rx="3.5" fill="#111827" />
			<rect x="47.3" y="8" width="23" height="7" rx="3.5" fill="#111827" />
			<rect x="55.2" y="0" width="7" height="23" rx="3.5" fill="#111827" />
		</svg>
	);
}

function LineFace() {
	return (
		<svg aria-hidden="true" width="56" height="6" viewBox="0 0 82 8" xmlns="http://www.w3.org/2000/svg">
			<rect x="0.07" y="0.16" width="6.9" height="6.9" rx="3.5" fill="#111827" />
			<rect x="7.9" y="0.16" width="20.7" height="6.9" rx="3.5" fill="#111827" />
			<rect x="53.1" y="0.16" width="20.7" height="6.9" rx="3.5" fill="#111827" />
			<rect x="74.7" y="0.16" width="6.9" height="6.9" rx="3.5" fill="#111827" />
		</svg>
	);
}

function CurvedFace() {
	return (
		<svg aria-hidden="true" width="56" height="8" viewBox="0 0 63 9" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M0 5.1c0-.1 0-.2 0-.3.1-.5.3-1 .7-1.3.1 0 .1-.1.2-.1C2.4 2.2 6 0 10.5 0S18.6 2.2 20.2 3.3c.1 0 .1.1.1.1.4.3.7.9.7 1.3v.3c0 1 0 1.4 0 1.7-.2 1.3-1.2 1.9-2.5 1.6-.2 0-.7-.3-1.8-.8C15 6.7 12.8 6 10.5 6s-4.5.7-6.3 1.5c-1 .5-1.5.7-1.8.8-1.3.3-2.3-.3-2.5-1.6v-1.7z"
				fill="#111827"
			/>
			<path
				d="M42 5.1c0-.1 0-.2 0-.3.1-.5.3-1 .7-1.3.1 0 .1-.1.2-.1C44.4 2.2 48 0 52.5 0S60.6 2.2 62.2 3.3c.1 0 .1.1.1.1.4.3.7.9.7 1.3v.3c0 1 0 1.4 0 1.7-.2 1.3-1.2 1.9-2.5 1.6-.2 0-.7-.3-1.8-.8C57 6.7 54.8 6 52.5 6s-4.5.7-6.3 1.5c-1 .5-1.5.7-1.8.8-1.3.3-2.3-.3-2.5-1.6v-1.7z"
				fill="#111827"
			/>
		</svg>
	);
}

const facehashColors = [
	"#64748b",
	"#6b7280",
	"#71717a",
	"#737373",
	"#78716c",
	"#ef4444",
	"#f97316",
	"#f59e0b",
	"#eab308",
	"#84cc16",
	"#22c55e",
	"#10b981",
	"#14b8a6",
	"#06b6d4",
	"#0ea5e9",
	"#3b82f6",
	"#6366f1",
	"#8b5cf6",
	"#a855f7",
	"#d946ef",
	"#ec4899",
	"#f43f5e",
] as const;

const faceComponents = [RoundFace, CrossFace, LineFace, CurvedFace] as const;

function getFacehashInitial(displayName: string, address: string) {
	const normalizedDisplayName = displayName.trim();

	if (normalizedDisplayName) {
		return normalizedDisplayName[0]?.toUpperCase() ?? "?";
	}

	const compactAddress = address.replace(/^0x/i, "");
	return compactAddress[0]?.toUpperCase() ?? "?";
}

function OpenGraphFacehash({ address, displayName }: { address: string; displayName: string }) {
	const seed = displayName.trim() || address;
	const hash = stringHash(seed);
	const FaceComponent = faceComponents[hash % faceComponents.length] ?? RoundFace;
	const backgroundColor = facehashColors[hash % facehashColors.length] ?? facehashColors[0];
	const initial = getFacehashInitial(displayName, address);

	return (
		<div
			style={{
				display: "flex",
				position: "relative",
				alignItems: "center",
				justifyContent: "center",
				width: 96,
				height: 96,
				borderRadius: 8,
				overflow: "hidden",
				backgroundColor,
				border: "2px solid rgba(255, 255, 255, 0.12)",
				flexShrink: 0,
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: "linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 60%)",
				}}
			/>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					zIndex: 1,
				}}
			>
				<FaceComponent />
				<div
					style={{
						display: "flex",
						marginTop: 8,
						fontSize: 26,
						lineHeight: 1,
						fontWeight: 800,
						fontFamily: "ui-monospace, monospace",
					}}
				>
					{initial}
				</div>
			</div>
		</div>
	);
}

function samplePoints(points: PnlDataPoint[], maxPoints: number) {
	if (points.length <= maxPoints) {
		return points;
	}

	const lastIndex = points.length - 1;
	const step = lastIndex / (maxPoints - 1);
	const sampled: PnlDataPoint[] = [];
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

function buildChartGeometry(points: PnlDataPoint[]): ChartGeometry | null {
	const sampled = samplePoints(points, 56);

	if (sampled.length < 2) {
		return null;
	}

	const width = 760;
	const height = 240;
	const inset = 14;
	const values = sampled.map((point) => point.p);
	const minValue = Math.min(...values, 0);
	const maxValue = Math.max(...values, 0);
	const span = maxValue - minValue || 1;
	const firstX = inset;
	const lastX = width - inset;

	const xAt = (index: number) => {
		return firstX + ((lastX - firstX) * index) / (sampled.length - 1);
	};

	const yAt = (value: number) => {
		return inset + ((maxValue - value) * (height - inset * 2)) / span;
	};

	const zeroY = yAt(0);
	const linePath = sampled
		.map((point, index) => {
			const command = index === 0 ? "M" : "L";
			return `${command} ${xAt(index).toFixed(2)} ${yAt(point.p).toFixed(2)}`;
		})
		.join(" ");
	const areaPath = `${linePath} L ${lastX.toFixed(2)} ${zeroY.toFixed(2)} L ${firstX.toFixed(2)} ${zeroY.toFixed(2)} Z`;
	const lastValue = sampled[sampled.length - 1].p;

	return {
		areaPath,
		linePath,
		minLabel: formatNumber(minValue, { compact: true, currency: true }),
		maxLabel: formatNumber(maxValue, { compact: true, currency: true }),
		lastPoint: {
			x: xAt(sampled.length - 1),
			y: yAt(lastValue),
			value: lastValue,
		},
		zeroY,
	};
}

function getSignedTone(value: number) {
	return value >= 0 ? ogPalette.positive : ogPalette.negative;
}

function renderInfoRow(label: string, value: string, tone?: string, isLast = false) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "8px 0",
				borderBottom: isLast ? "none" : `1px solid ${ogPalette.cardBorder}`,
			}}
		>
			<div style={{ display: "flex", fontSize: 16, color: ogPalette.mutedForeground }}>{label}</div>
			<div style={{ display: "flex", fontSize: 16, fontWeight: 600, color: tone ?? ogPalette.foreground }}>{value}</div>
		</div>
	);
}

export default async function OpenGraphImage({ params }: Props) {
	const { address: rawAddress } = await params;
	const address = normalizeWalletAddress(rawAddress);

	if (!address) {
		notFound();
	}

	const { displayName, pnlSummary, pnlCandles, streaks, profile } = await loadTraderOpenGraphData(address);

	if (!profile && !pnlSummary) {
		notFound();
	}

	const chart = buildChartGeometry(pnlCandles);
	const headlinePnl = chart?.lastPoint.value ?? 0;

	const activeSince = formatDateShort(pnlSummary?.first_trade_at) || "Unknown";
	const lastActive = formatDateShort(pnlSummary?.last_trade_at) || "Unknown";
	const totalVolume = formatNumber(pnlSummary?.total_volume_usd ?? 0, { compact: true, currency: true });
	const totalFees = formatNumber(pnlSummary?.total_fees ?? 0, { compact: true, currency: true });
	const totalBuys = formatNumber(pnlSummary?.total_buys ?? 0, { decimals: 0 });
	const totalSells = formatNumber(pnlSummary?.total_sells ?? 0, { decimals: 0 });
	const totalRedemptions = formatNumber(pnlSummary?.total_redemptions ?? 0, { decimals: 0 });
	const totalMerges = formatNumber(pnlSummary?.total_merges ?? 0, { decimals: 0 });

	const marketsTraded = formatNumber(pnlSummary?.markets_traded ?? 0, { decimals: 0 });
	const marketsWon = formatNumber(pnlSummary?.markets_won ?? 0, { decimals: 0 });
	const marketsLost = formatNumber(pnlSummary?.markets_lost ?? 0, { decimals: 0 });
	const avgHold = pnlSummary?.avg_hold_time_seconds ? formatDuration(pnlSummary.avg_hold_time_seconds) : "—";
	const bestDay = streaks.bestDay.pnl === 0 ? "—" : formatNumber(streaks.bestDay.pnl, { compact: true, currency: true });
	const worstDay = streaks.worstDay.pnl === 0 ? "—" : formatNumber(streaks.worstDay.pnl, { compact: true, currency: true });
	const longestWin = `${streaks.longestWin}d`;
	const longestLoss = `${streaks.longestLoss}d`;
	const currentStreak = streaks.current === 0 ? "Flat" : `${Math.abs(streaks.current)}d ${streaks.current > 0 ? "W" : "L"}`;

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
					padding: "20px 24px",
					width: "100%",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						gap: 20,
						width: "100%",
						minWidth: 0,
					}}
				>
					<OpenGraphFacehash address={address} displayName={displayName} />
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 16,
							flex: 1,
							minWidth: 0,
							overflow: "hidden",
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								gap: 8,
								flexWrap: "wrap",
							}}
						>
							<div
								style={{
									display: "flex",
									fontSize: 26,
									fontWeight: 500,
									lineHeight: 1.2,
									maxWidth: 420,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{displayName}
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									fontSize: 14,
									fontFamily: "ui-monospace, monospace",
									color: ogPalette.foreground,
									backgroundColor: ogPalette.muted,
									padding: "5px 10px",
									borderRadius: 8,
									flexShrink: 0,
								}}
							>
								{truncateAddress(address, 4)}
							</div>
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "flex-start",
								gap: 32,
								width: "100%",
								minWidth: 0,
								flexWrap: "nowrap",
							}}
						>
							<OgStatItem label="Active Since" value={activeSince} />
							<OgStatItem label="Last Active" value={lastActive} />
							<OgStatItem label="Buys" value={totalBuys} />
							<OgStatItem label="Sells" value={totalSells} />
							<OgStatItem label="Redemptions" value={totalRedemptions} />
							<OgStatItem label="Merges" value={totalMerges} />
							<OgStatItem label="Volume" value={totalVolume} />
							<OgStatItem label="Fees" value={totalFees} />
						</div>
					</div>
				</div>
			</div>

			{/* Content row — 2/3 chart + 1/3 performance */}
			<div
				style={{
					display: "flex",
					flex: 1,
					gap: 14,
				}}
			>
				{/* Chart card — matches PnlCard */}
				<div
					style={{
						display: "flex",
						flex: 1,
						flexDirection: "column",
						borderRadius: 16,
						background: ogPalette.card,
						padding: 20,
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: 8,
						}}
					>
						<div style={{ display: "flex", flexDirection: "column" }}>
							<div style={{ display: "flex", fontSize: 14, color: ogPalette.mutedForeground }}>Cumulative PnL</div>
							<div
								style={{
									display: "flex",
									marginTop: 4,
									fontSize: 40,
									fontWeight: 700,
									lineHeight: 1,
									color: getSignedTone(headlinePnl),
								}}
							>
								{formatNumber(headlinePnl, { compact: true, currency: true })}
							</div>
						</div>
						<div
							style={{
								display: "flex",
								padding: "6px 12px",
								borderRadius: 999,
								background: ogPalette.muted,
								fontSize: 14,
								color: ogPalette.foreground,
							}}
						>
							{`Streak: ${currentStreak}`}
						</div>
					</div>

					{chart ? (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
							}}
						>
							<svg viewBox="0 0 760 240" width="760" height="280">
								<path d={chart.areaPath} fill={ogPalette.chartArea} />
								<line x1="14" x2="746" y1={chart.zeroY} y2={chart.zeroY} stroke={ogPalette.zeroLine} strokeWidth="2" />
								<path d={chart.linePath} fill="none" stroke={ogPalette.chartLine} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
								<circle
									cx={chart.lastPoint.x}
									cy={chart.lastPoint.y}
									r="7"
									fill={getSignedTone(chart.lastPoint.value)}
									stroke="#ffffff"
									strokeWidth="2.5"
								/>
							</svg>

							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginTop: 4,
									fontSize: 14,
									color: ogPalette.mutedForeground,
								}}
							>
								<div style={{ display: "flex" }}>{`Low: ${chart.minLabel}`}</div>
								<div style={{ display: "flex" }}>{`High: ${chart.maxLabel}`}</div>
							</div>
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
							Lifetime PnL chart unavailable
						</div>
					)}
				</div>

				{/* Performance card — matches PerformanceSummary */}
				<div
					style={{
						display: "flex",
						width: 310,
						flexDirection: "column",
						borderRadius: 16,
						background: ogPalette.card,
						padding: "14px 20px",
					}}
				>
					<div
						style={{
							display: "flex",
							fontSize: 16,
							color: ogPalette.foreground,
							marginBottom: 8,
						}}
					>
						Performance Summary
					</div>

					<div style={{ display: "flex", flexDirection: "column" }}>
						{renderInfoRow("Markets Traded", marketsTraded)}
						{renderInfoRow("Markets Won", marketsWon, ogPalette.positive)}
						{renderInfoRow("Markets Lost", marketsLost, ogPalette.negative)}
						{renderInfoRow("Avg. Hold Time", avgHold)}
						{renderInfoRow("Best Day", bestDay, streaks.bestDay.pnl > 0 ? ogPalette.positive : undefined)}
						{renderInfoRow("Worst Day", worstDay, streaks.worstDay.pnl < 0 ? ogPalette.negative : undefined)}
						{renderInfoRow("Win Streak", longestWin)}
						{renderInfoRow("Loss Streak", longestLoss)}
						{renderInfoRow("Current Streak", currentStreak, undefined, true)}
					</div>
				</div>
			</div>
		</div>,
		size,
	);
}
