export const ogImageSize = { width: 1200, height: 630 };

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
