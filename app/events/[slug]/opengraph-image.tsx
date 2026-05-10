import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { formatNumber } from "@/lib/format";
import { getEventBySlug } from "@/lib/struct/queries/events";
import { loadImageAsDataUrl, ogImageSize, ogPalette, OgStatItem } from "@/lib/opengraph";

export const runtime = "nodejs";
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Polymarket event preview";

type Props = {
	params: Promise<{ slug: string }>;
};

function getStatusBadgeStyle(status: string) {
	const lowered = status.toLowerCase();
	if (lowered === "open" || lowered === "active") {
		return { color: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.2)" };
	}
	if (lowered === "closed" || lowered === "resolved") {
		return { color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.2)" };
	}
	return { color: ogPalette.foreground, backgroundColor: ogPalette.muted };
}

function getStatusLabel(status: string) {
	const lowered = status.toLowerCase();
	if (lowered === "open" || lowered === "active") return "Open";
	return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function OpenGraphImage({ params }: Props) {
	const { slug } = await params;
	const event = await getEventBySlug(slug);

	if (!event) {
		notFound();
	}

	const imageDataUrl = await loadImageAsDataUrl(event.image_url, 192);
	const title = event.title ?? slug.replace(/-/g, " ");
	const status = event.status ?? "unknown";
	const marketCount = event.market_count ?? event.markets?.length ?? 0;
	const lifetime = event.metrics?.lifetime;
	const volume = formatNumber(lifetime?.volume ?? 0, { compact: true, currency: true });
	const txns = formatNumber(lifetime?.txns ?? 0, { decimals: 0 });
	const traders = formatNumber(lifetime?.unique_traders ?? 0, { decimals: 0 });

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
					padding: "32px 36px",
					width: "100%",
					gap: 24,
					flex: 1,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 24,
						flex: 1,
					}}
				>
					{imageDataUrl && (
						<div
							style={{
								display: "flex",
								width: 132,
								height: 132,
								borderRadius: 16,
								overflow: "hidden",
								border: "2px solid rgba(255, 255, 255, 0.12)",
								flexShrink: 0,
							}}
						>
							<img
								src={imageDataUrl}
								width={132}
								height={132}
								alt=""
								style={{ width: 132, height: 132, objectFit: "cover", borderRadius: 16 }}
							/>
						</div>
					)}
					<div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 12 }}>
						<div
							style={{
								display: "flex",
								fontSize: 14,
								fontWeight: 600,
								letterSpacing: 1.5,
								textTransform: "uppercase",
								color: ogPalette.mutedForeground,
							}}
						>
							Polymarket Event
						</div>
						<div
							style={{
								display: "flex",
								fontSize: 44,
								fontWeight: 600,
								lineHeight: 1.2,
								maxWidth: 920,
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						>
							{title}
						</div>
					</div>
				</div>
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
				<div style={{ display: "flex", flexDirection: "row", gap: 32 }}>
					<OgStatItem label="Markets" value={String(marketCount)} />
					<OgStatItem label="Volume" value={volume} />
					<OgStatItem label="Txns" value={txns} />
					<OgStatItem label="Traders" value={traders} />
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
