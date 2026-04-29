import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import sharp from "sharp";

import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";

export const ogImageSize = { width: 1200, height: 630 };
export const ogCacheLife = {
	stale: 43200,
	revalidate: 86400,
	expire: 604800,
} as const;
const ogImageFetchTimeoutMs = 5000;
const ogImageMaxBytes = 1024 * 1024;
const ogAllowedProtocols = new Set(["http:", "https:"]);

function isBlockedIpv4Address(address: string): boolean {
	const octets = address.split(".").map((part) => Number(part));

	if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
		return true;
	}

	const [first, second] = octets;

	return (
		first === 0 ||
		first === 10 ||
		first === 127 ||
		(first === 169 && second === 254) ||
		(first === 172 && second >= 16 && second <= 31) ||
		(first === 192 && second === 168) ||
		(first === 100 && second >= 64 && second <= 127) ||
		(first === 198 && (second === 18 || second === 19)) ||
		first >= 224
	);
}

function isBlockedIpv6Address(address: string): boolean {
	const normalized = address.toLowerCase();

	if (normalized === "::" || normalized === "::1") {
		return true;
	}

	if (normalized.startsWith("::ffff:")) {
		return isBlockedIpAddress(normalized.slice("::ffff:".length));
	}

	return normalized.startsWith("fc")
		|| normalized.startsWith("fd")
		|| /^fe[89ab]/.test(normalized);
}

function isBlockedIpAddress(address: string): boolean {
	const version = isIP(address);

	if (version === 4) {
		return isBlockedIpv4Address(address);
	}

	if (version === 6) {
		return isBlockedIpv6Address(address);
	}

	return false;
}

async function resolveOgImageUrl(src: string): Promise<URL | null> {
	const normalizedSrc = normalizePolymarketS3ImageUrl(src) ?? src;
	let url: URL;

	try {
		url = new URL(normalizedSrc);
	} catch {
		return null;
	}

	if (!ogAllowedProtocols.has(url.protocol) || url.hostname.toLowerCase() === "localhost") {
		return null;
	}

	if (isBlockedIpAddress(url.hostname)) {
		return null;
	}

	try {
		const resolvedAddresses = await lookup(url.hostname, { all: true, verbatim: true });

		if (resolvedAddresses.length === 0) {
			return null;
		}

		if (resolvedAddresses.some(({ address }) => isBlockedIpAddress(address))) {
			return null;
		}
	} catch {
		return null;
	}

	return url;
}

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

	const resolvedUrl = await resolveOgImageUrl(src);

	if (!resolvedUrl) {
		return null;
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), ogImageFetchTimeoutMs);

	try {
		const response = await fetch(resolvedUrl, {
			signal: controller.signal,
			redirect: "error",
		});
		if (!response.ok) return null;

		const contentLengthHeader = response.headers.get("content-length");
		const contentLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;

		if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > ogImageMaxBytes) {
			return null;
		}

		const contentType = response.headers.get("content-type");

		if (!contentType?.startsWith("image/")) {
			return null;
		}

		const imageBytes = await response.arrayBuffer();

		if (imageBytes.byteLength > ogImageMaxBytes) {
			return null;
		}

		const buffer = Buffer.from(imageBytes);
		const png = await sharp(buffer).resize(size, size, { fit: "cover" }).png().toBuffer();
		return `data:image/png;base64,${png.toString("base64")}`;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			return null;
		}

		console.error("Failed to load image for OG:", error);
		return null;
	} finally {
		clearTimeout(timeoutId);
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
	titleSize = 120,
	positions = ogFloatingPositions,
	images,
	children,
}: {
	subtitle: string;
	title: React.ReactNode;
	titleColor?: string;
	titleSize?: number;
	positions?: typeof ogFloatingPositions;
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
						fontSize: titleSize,
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
				const pos = positions[i];

				if (!dataUrl || !pos) return null;

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
