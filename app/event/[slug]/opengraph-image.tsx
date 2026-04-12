import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { formatNumber } from "@/lib/format";
import { getEventBySlug } from "@/lib/struct/market-queries";

export const runtime = "nodejs";
export const revalidate = 7200;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Polymarket event prediction overview";

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

function renderOutcomeBar(label: string, probability: number | null) {
	const pct = probability !== null ? Math.round(probability * 100) : 0;
	const barWidth = probability !== null ? Math.max(pct, 4) : 0;
	const tone = pct >= 50 ? palette.positive : palette.negative;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 4,
				width: "100%",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					fontSize: 14,
				}}
			>
				<div
					style={{
						display: "flex",
						color: palette.foreground,
						maxWidth: 340,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{label}
				</div>
				<div
					style={{
						display: "flex",
						fontWeight: 700,
						color: tone,
					}}
				>
					{probability !== null ? `${pct}%` : "—"}
				</div>
			</div>
			<div
				style={{
					display: "flex",
					height: 6,
					width: "100%",
					borderRadius: 3,
					backgroundColor: palette.muted,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						display: "flex",
						height: "100%",
						width: `${barWidth}%`,
						borderRadius: 3,
						backgroundColor: tone,
					}}
				/>
			</div>
		</div>
	);
}

export default async function OpenGraphImage({ params }: Props) {
	const { slug } = await params;
	const event = await getEventBySlug(slug);

	if (!event) {
		notFound();
	}

	const volume24h = event.metrics?.["24h"]?.volume ?? null;
	const topMarkets = event.markets.slice(0, 4);

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
					padding: "20px 24px",
					width: "100%",
					gap: 16,
				}}
			>
				<div
					style={{
						display: "flex",
						fontSize: 32,
						fontWeight: 700,
						lineHeight: 1.2,
						maxWidth: "100%",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{event.title ?? "Untitled Event"}
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						gap: 32,
					}}
				>
					{renderStatItem("Markets", String(event.market_count))}
					{volume24h !== null && renderStatItem("24h Volume", formatNumber(volume24h, { compact: true, currency: true }))}
					{event.status && renderStatItem("Status", event.status)}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					flex: 1,
					flexDirection: "column",
					borderRadius: 16,
					background: palette.card,
					padding: "20px 24px",
					gap: 16,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						display: "flex",
						fontSize: 16,
						color: palette.mutedForeground,
					}}
				>
					Top Markets
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 14,
						flex: 1,
					}}
				>
					{topMarkets.map((market) => {
						const topOutcome = market.outcomes?.reduce<{
							label: string;
							probability: number | null;
						} | null>((best, o) => {
							if (!best || (o.price ?? 0) > (best.probability ?? 0)) {
								return { label: o.name, probability: o.price ?? null };
							}
							return best;
						}, null);

						return (
							<div
								key={market.condition_id}
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 6,
									borderBottom: `1px solid ${palette.cardBorder}`,
									paddingBottom: 12,
								}}
							>
								<div
									style={{
										display: "flex",
										fontSize: 16,
										fontWeight: 500,
										color: palette.foreground,
										maxWidth: "100%",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{market.question ?? "Untitled Market"}
								</div>
								{market.outcomes && market.outcomes.length > 0 && (
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: 6,
										}}
									>
										{market.outcomes.slice(0, 2).map((o) => (
											<div key={o.name} style={{ display: "flex", width: "100%" }}>
												{renderOutcomeBar(o.name, o.price ?? null)}
											</div>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{event.tags.length > 0 && (
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						gap: 8,
						flexWrap: "wrap",
					}}
				>
					{event.tags.slice(0, 6).map((tag) => (
						<div
							key={tag.id}
							style={{
								display: "flex",
								padding: "4px 12px",
								borderRadius: 999,
								background: palette.muted,
								fontSize: 13,
								color: palette.foreground,
							}}
						>
							{tag.label}
						</div>
					))}
				</div>
			)}
		</div>,
		size,
	);
}
