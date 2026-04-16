import sharp from "sharp";

import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";

export const ogImageSize = { width: 1200, height: 630 };

export function deduplicateByImage<T extends { image_url?: string | null }>(items: T[], limit: number): T[] {
	const seen = new Set<string>();
	const result: T[] = [];
	for (const item of items) {
		if (!item.image_url || seen.has(item.image_url)) continue;
		seen.add(item.image_url);
		result.push(item);
		if (result.length >= limit) break;
	}
	return result;
}

export async function loadImageAsDataUrl(
	src: string | null | undefined,
	size: number,
): Promise<string | null> {
	if (!src) return null;

	try {
		const response = await fetch(normalizePolymarketS3ImageUrl(src) ?? src);
		if (!response.ok) return null;

		const buffer = Buffer.from(await response.arrayBuffer());
		const png = await sharp(buffer).resize(size, size, { fit: "cover" }).png().toBuffer();
		return `data:image/png;base64,${png.toString("base64")}`;
	} catch (error) {
		console.error("Failed to load image for OG:", error);
		return null;
	}
}

export const ogPalette = {
	background: "#0A0A0A",
	card: "#171717",
	cardBorder: "#2E2E2E",
	foreground: "#fafafa",
	mutedForeground: "#a3a3a3",
	muted: "#3c3c3c",
	positive: "#10b981",
	negative: "#ef4444",
	chartLine: "#8EC5FF",
	chartArea: "rgba(125, 211, 252, 0.05)",
	zeroLine: "rgba(255, 255, 255, 0.05)",
};

export const ogFloatingPositions = [
	{ x: 15, y: 15, size: 90, rotate: -12, opacity: 0.5 },
	{ x: 130, y: 70, size: 75, rotate: 8, opacity: 0.45 },
	{ x: 40, y: 440, size: 85, rotate: 15, opacity: 0.5 },
	{ x: 170, y: 330, size: 68, rotate: -6, opacity: 0.4 },
	{ x: 1060, y: 20, size: 85, rotate: 10, opacity: 0.5 },
	{ x: 1090, y: 190, size: 72, rotate: -14, opacity: 0.45 },
	{ x: 1030, y: 420, size: 80, rotate: 7, opacity: 0.5 },
	{ x: 1100, y: 520, size: 68, rotate: -10, opacity: 0.4 },
	{ x: 440, y: 15, size: 68, rotate: -8, opacity: 0.35 },
	{ x: 700, y: 12, size: 64, rotate: 12, opacity: 0.35 },
	{ x: 490, y: 530, size: 70, rotate: 6, opacity: 0.35 },
	{ x: 740, y: 535, size: 64, rotate: -9, opacity: 0.35 },
];

export function OgCollectionLayout({
	subtitle,
	title,
	titleColor,
	images,
	children,
}: {
	subtitle: string;
	title: React.ReactNode;
	titleColor?: string;
	images: (string | null)[];
	children?: React.ReactNode;
}) {
	return (
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
				position: "relative",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					display: "flex",
					flex: 1,
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					borderRadius: 16,
					background: ogPalette.card,
					padding: "40px 28px",
					gap: 0,
				}}
			>
				<div style={{ display: "flex", fontSize: 26, color: ogPalette.mutedForeground }}>
					{subtitle}
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "baseline",
						fontSize: 120,
						fontWeight: 800,
						lineHeight: 0.9,
						marginTop: 40,
						marginBottom: 40,
						color: titleColor ?? ogPalette.foreground,
					}}
				>
					{title}
				</div>
				{children}
			</div>

			{images.map((dataUrl, i) => {
				if (!dataUrl) return null;
				const pos = ogFloatingPositions[i];
				return (
					<div
						key={i}
						style={{
							display: "flex",
							position: "absolute",
							left: pos.x,
							top: pos.y,
							width: pos.size,
							height: pos.size,
							borderRadius: 14,
							overflow: "hidden",
							opacity: pos.opacity,
							transform: `rotate(${pos.rotate}deg)`,
							border: "2px solid rgba(255, 255, 255, 0.08)",
							boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
						}}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={dataUrl}
							width={pos.size}
							height={pos.size}
							alt=""
							style={{ width: pos.size, height: pos.size, objectFit: "cover" }}
						/>
					</div>
				);
			})}
		</div>
	);
}

export function OgStatItem({ label, value }: { label: string; value: string }) {
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
					color: ogPalette.mutedForeground,
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
					color: ogPalette.foreground,
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
