import type { BuilderTagRow } from "@structbuild/sdk";
import { ImageResponse } from "next/og";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import {
	loadBuilderOpenGraphData,
} from "@/lib/builder-open-graph";
import { formatCapitalizeWords, formatNumber } from "@/lib/format";
import { getBuilderAnalyticsTimeseries } from "@/lib/struct/analytics-queries";
import type { AnalyticsPoint } from "@/lib/struct/analytics-shared";
import {
	loadImageAsDataUrl,
	ogCacheLife,
	ogImageSize,
	ogPalette,
	OgStatItem,
} from "@/lib/opengraph";

export const runtime = "nodejs";
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Polymarket builder summary preview";

type Props = {
	params: Promise<{ code: string }>;
};

type TagBar = {
	tagKey: string;
	label: string;
	sharePct: number;
	volumeLabel: string;
};

type VolumeChartGeometry = {
	areaPath: string;
	linePath: string;
	minLabel: string;
	maxLabel: string;
	lastPoint: { x: number; y: number; value: number };
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

function getFacehashInitial(displayName: string, code: string) {
	const normalizedDisplayName = displayName.trim();

	if (normalizedDisplayName) {
		return normalizedDisplayName[0]?.toUpperCase() ?? "?";
	}

	const compactCode = code.replace(/^0x/i, "");
	return compactCode[0]?.toUpperCase() ?? "?";
}

function OpenGraphAvatarImage({ src }: { src: string }) {
	return (
		<div
			style={{
				display: "flex",
				width: 96,
				height: 96,
				borderRadius: 8,
				overflow: "hidden",
				border: "2px solid rgba(255, 255, 255, 0.12)",
				flexShrink: 0,
			}}
		>
			<img
				src={src}
				width={96}
				height={96}
				alt=""
				style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }}
			/>
		</div>
	);
}

function OpenGraphFacehash({ code, displayName }: { code: string; displayName: string }) {
	const seed = displayName.trim() || code;
	const hash = stringHash(seed);
	const FaceComponent = faceComponents[hash % faceComponents.length] ?? RoundFace;
	const backgroundColor = facehashColors[hash % facehashColors.length] ?? facehashColors[0];
	const initial = getFacehashInitial(displayName, code);

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

function buildTagBars(tags: BuilderTagRow[]): TagBar[] {
	const total = tags.reduce((sum, row) => sum + (row.volume_usd ?? 0), 0);
	if (total <= 0) return [];

	return tags.map((row) => {
		const vol = row.volume_usd ?? 0;
		return {
			tagKey: row.tag,
			label: formatCapitalizeWords(row.tag),
			sharePct: (vol / total) * 100,
			volumeLabel: formatNumber(vol, { compact: true, currency: true }),
		};
	});
}

function bpsToLabel(bps: number | null | undefined): string {
	if (bps == null) return "—";
	return `${(bps / 100).toFixed(2)}%`;
}

function sampleVolumePoints(points: AnalyticsPoint[], maxPoints: number) {
	if (points.length <= maxPoints) {
		return points;
	}

	const lastIndex = points.length - 1;
	const step = lastIndex / (maxPoints - 1);
	const sampled: AnalyticsPoint[] = [];
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

function buildVolumeChartGeometry(points: AnalyticsPoint[]): VolumeChartGeometry | null {
	const sampled = sampleVolumePoints(points, 56);

	if (sampled.length < 2) {
		return null;
	}

	const width = 760;
	const height = 240;
	const inset = 14;
	const values = sampled.map((p) => p.volumeUsd);
	const minValue = Math.min(...values, 0);
	const maxValue = Math.max(...values, minValue + 1e-9);
	const span = maxValue - minValue || 1;
	const firstX = inset;
	const lastX = width - inset;

	const xAt = (index: number) => {
		return firstX + ((lastX - firstX) * index) / (sampled.length - 1);
	};

	const yAt = (value: number) => {
		return inset + ((maxValue - value) * (height - inset * 2)) / span;
	};

	const baselineY = yAt(minValue);
	const linePath = sampled
		.map((point, index) => {
			const command = index === 0 ? "M" : "L";
			return `${command} ${xAt(index).toFixed(2)} ${yAt(point.volumeUsd).toFixed(2)}`;
		})
		.join(" ");
	const areaPath = `${linePath} L ${lastX.toFixed(2)} ${baselineY.toFixed(2)} L ${firstX.toFixed(2)} ${baselineY.toFixed(2)} Z`;
	const lastValue = sampled[sampled.length - 1].volumeUsd;

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
	};
}

async function loadCachedBuilderOpenGraphData(code: string) {
	"use cache";
	cacheLife(ogCacheLife);

	const [builderData, volumeTimeseries] = await Promise.all([
		loadBuilderOpenGraphData(code),
		getBuilderAnalyticsTimeseries(code, "all", "D"),
	]);

	if (!builderData.builder && !builderData.metadata) {
		return null;
	}

	const iconDataUrl = await loadImageAsDataUrl(builderData.metadata?.icon_url, 192);

	return { iconDataUrl, volumeTimeseries, ...builderData };
}

export default async function OpenGraphImage({ params }: Props) {
	const { code } = await params;

	const data = await loadCachedBuilderOpenGraphData(code);

	if (!data) {
		notFound();
	}

	const { iconDataUrl, codeLabel, displayName, builder, fees, tags, volumeTimeseries } = data;
	const volumeChart = buildVolumeChartGeometry(volumeTimeseries);
	const tagBars = buildTagBars(tags);

	const headlineVolume = formatNumber(builder?.volume_usd ?? 0, { compact: true, currency: true });
	const builderFees = formatNumber(builder?.builder_fees ?? 0, { compact: true, currency: true });
	const traders = formatNumber(builder?.unique_traders ?? 0, { decimals: 0 });
	const trades = formatNumber(builder?.txn_count ?? 0, { decimals: 0 });
	const arpu = formatNumber(builder?.avg_rev_per_user ?? 0, { compact: true, currency: true });
	const avpu = formatNumber(builder?.avg_vol_per_user ?? 0, { compact: true, currency: true });
	const makerFeeBps = fees?.builder_maker_fee_rate_bps ?? builder?.builder_maker_fee_rate_bps;
	const takerFeeBps = fees?.builder_taker_fee_rate_bps ?? builder?.builder_taker_fee_rate_bps;
	const feeLabel = `${bpsToLabel(makerFeeBps)} / ${bpsToLabel(takerFeeBps)}`;

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
					{iconDataUrl ? (
						<OpenGraphAvatarImage src={iconDataUrl} />
					) : (
						<OpenGraphFacehash code={code} displayName={displayName} />
					)}
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
								{codeLabel}
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
							<OgStatItem label="Volume" value={headlineVolume} />
							<OgStatItem label="Builder Fees" value={builderFees} />
							<OgStatItem label="Traders" value={traders} />
							<OgStatItem label="Trades" value={trades} />
							<OgStatItem label="ARPU" value={arpu} />
							<OgStatItem label="AVPU" value={avpu} />
							<OgStatItem label="Maker / Taker" value={feeLabel} />
						</div>
					</div>
				</div>
			</div>

			<div
				style={{
					display: "flex",
					flex: 1,
					gap: 14,
				}}
			>
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
							<div style={{ display: "flex", fontSize: 14, color: ogPalette.mutedForeground }}>
								Cumulative Volume
							</div>
							<div
								style={{
									display: "flex",
									marginTop: 4,
									fontSize: 40,
									fontWeight: 700,
									lineHeight: 1,
									color: ogPalette.foreground,
								}}
							>
								{headlineVolume}
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
							{`${trades} trades`}
						</div>
					</div>

					{volumeChart ? (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
							}}
						>
							<svg viewBox="0 0 760 240" width="760" height="280">
								<path d={volumeChart.areaPath} fill={ogPalette.chartArea} />
								<path
									d={volumeChart.linePath}
									fill="none"
									stroke={ogPalette.chartLine}
									strokeWidth="4"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<circle
									cx={volumeChart.lastPoint.x}
									cy={volumeChart.lastPoint.y}
									r="7"
									fill={ogPalette.chartLine}
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
								<div style={{ display: "flex" }}>{`Low: ${volumeChart.minLabel}`}</div>
								<div style={{ display: "flex" }}>{`High: ${volumeChart.maxLabel}`}</div>
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
							Volume chart unavailable
						</div>
					)}
				</div>

				<div
					style={{
						display: "flex",
						width: 310,
						flexDirection: "column",
						borderRadius: 16,
						background: ogPalette.card,
						padding: "14px 18px",
						minHeight: 0,
					}}
				>
					<div
						style={{
							display: "flex",
							fontSize: 16,
							fontWeight: 600,
							color: ogPalette.foreground,
							marginBottom: 10,
						}}
					>
						Top Tags by Volume
					</div>

					{tagBars.length > 0 ? (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
								gap: 8,
								minHeight: 0,
							}}
						>
							{tagBars.map((bar) => (
								<div
									key={bar.tagKey}
									style={{
										display: "flex",
										flexDirection: "column",
										gap: 3,
									}}
								>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-start",
											gap: 8,
											fontSize: 13,
											color: ogPalette.foreground,
										}}
									>
										<div
											style={{
												display: "flex",
												flex: 1,
												minWidth: 0,
												fontSize: 13,
												lineHeight: 1.25,
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{bar.label}
										</div>
										<div
											style={{
												display: "flex",
												flexShrink: 0,
												fontSize: 12,
												color: ogPalette.mutedForeground,
												fontFamily: "ui-monospace, monospace",
												textAlign: "right",
												whiteSpace: "nowrap",
											}}
										>
											{`${bar.volumeLabel} · ${bar.sharePct.toFixed(1)}%`}
										</div>
									</div>
									<div
										style={{
											display: "flex",
											width: "100%",
											height: 6,
											borderRadius: 3,
											background: ogPalette.muted,
											overflow: "hidden",
										}}
									>
										<div
											style={{
												display: "flex",
												width: `${Math.max(2, Math.min(100, bar.sharePct))}%`,
												height: 6,
												background: ogPalette.chartLine,
											}}
										/>
									</div>
								</div>
							))}
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
								fontSize: 15,
								color: ogPalette.mutedForeground,
								padding: "12px 8px",
								textAlign: "center",
							}}
						>
							Tag breakdown unavailable
						</div>
					)}
				</div>
			</div>
		</div>,
		size,
	);
}
