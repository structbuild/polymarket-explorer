import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { formatDateShort, formatNumber } from "@/lib/format";
import { getMarketBySlug } from "@/lib/struct/market-queries";

export const runtime = "nodejs";
export const revalidate = 7200;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Polymarket market prediction preview";

type Props = {
	params: Promise<{ slug: string }>;
};

const palette = {
	background: "#0A0A0A",
	card: "#171717",
	cardBorder: "#2E2E2E",
	foreground: "#fafafa",
	mutedForeground: "#a3a3a3",
	muted: "#3c3c3c",
	positive: "#10b981",
	negative: "#ef4444",
};

const OUTCOME_COLORS = [
	"#10b981",
	"#3b82f6",
	"#f59e0b",
	"#8b5cf6",
	"#ef4444",
];

function renderStatItem(label: string, value: string) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 4,
				minWidth: 0,
				flexShrink: 0,
			}}
		>
			<div
				style={{
					display: "flex",
					fontSize: 13,
					color: palette.mutedForeground,
					whiteSpace: "nowrap",
				}}
			>
				{label}
			</div>
			<div
				style={{
					display: "flex",
					fontSize: 17,
					fontWeight: 600,
					color: palette.foreground,
					whiteSpace: "nowrap",
					overflow: "hidden",
					textOverflow: "ellipsis",
				}}
			>
				{value}
			</div>
		</div>
	);
}

function getStatusColor(status: string) {
	if (status === "open") return palette.positive;
	if (status === "closed") return palette.negative;
	return palette.mutedForeground;
}

export default async function OpenGraphImage({ params }: Props) {
	const { slug } = await params;
	const market = await getMarketBySlug(slug);

	if (!market) {
		notFound();
	}

	const question = market.question ?? market.title ?? slug;
	const status = market.status ?? "unknown";
	const volume = formatNumber(market.volume_usd ?? 0, { compact: true, currency: true });
	const liquidity = formatNumber(market.liquidity_usd ?? 0, { compact: true, currency: true });
	const holders = formatNumber(market.total_holders ?? 0, { decimals: 0 });
	const endDate = formatDateShort(market.end_time);

	const outcomes = market.outcomes ?? [];

	return new ImageResponse(
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				padding: 28,
				gap: 14,
				background: palette.background,
				color: palette.foreground,
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					borderRadius: 16,
					background: palette.card,
					padding: "24px 28px",
					width: "100%",
					gap: 16,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "space-between",
						gap: 16,
					}}
				>
					<div
						style={{
							display: "flex",
							fontSize: 28,
							fontWeight: 600,
							lineHeight: 1.3,
							maxWidth: 960,
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{question}
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							padding: "6px 14px",
							borderRadius: 999,
							fontSize: 14,
							fontWeight: 600,
							color: getStatusColor(status),
							backgroundColor: palette.muted,
							flexShrink: 0,
							textTransform: "capitalize",
						}}
					>
						{status}
					</div>
				</div>
			</div>

			<div
				style={{
					display: "flex",
					flex: 1,
					flexDirection: "column",
					borderRadius: 16,
					background: palette.card,
					padding: "24px 28px",
					gap: 20,
				}}
			>
				{outcomes.length > 0 && (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 12,
							width: "100%",
						}}
					>
						{outcomes.map((outcome, idx) => {
							const prob = outcome.price ?? 0;
							const percent = (prob * 100).toFixed(0);
							const barWidth = Math.max(prob * 100, 2);
							const color = OUTCOME_COLORS[idx % OUTCOME_COLORS.length];

							return (
								<div
									key={outcome.name}
									style={{
										display: "flex",
										flexDirection: "column",
										gap: 6,
									}}
								>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											fontSize: 18,
											fontWeight: 500,
										}}
									>
										<div style={{ display: "flex", color: palette.foreground }}>
											{outcome.name}
										</div>
										<div
											style={{
												display: "flex",
												fontSize: 22,
												fontWeight: 700,
												color,
											}}
										>
											{`${percent}%`}
										</div>
									</div>
									<div
										style={{
											display: "flex",
											width: "100%",
											height: 16,
											borderRadius: 8,
											backgroundColor: palette.muted,
											overflow: "hidden",
										}}
									>
										<div
											style={{
												display: "flex",
												width: `${barWidth}%`,
												height: "100%",
												borderRadius: 8,
												backgroundColor: color,
											}}
										/>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "row",
					borderRadius: 16,
					background: palette.card,
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
						gap: 48,
					}}
				>
					{renderStatItem("Volume", volume)}
					{renderStatItem("Liquidity", liquidity)}
					{renderStatItem("Holders", holders)}
					{renderStatItem("End Date", endDate)}
				</div>
				<div
					style={{
						display: "flex",
						fontSize: 14,
						color: palette.mutedForeground,
					}}
				>
					Polymarket Explorer
				</div>
			</div>
		</div>,
		size,
	);
}
