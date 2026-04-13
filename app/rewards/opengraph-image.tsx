import { ImageResponse } from "next/og";
import { formatNumber } from "@/lib/format";
import { ogImageSize, ogPalette } from "@/lib/opengraph";
import { getRewardsMarkets } from "@/lib/struct/queries";

export const runtime = "nodejs";
export const revalidate = 7200;
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Polymarket liquidity rewards overview";

export default async function OpenGraphImage() {
	const markets = await getRewardsMarkets();

	const totalDailyRewards = markets.reduce((sum, m) => {
		const rate = m.clob_rewards?.map((r) => r.total_daily_rate).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;
		return sum + rate;
	}, 0);

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
					flex: 1,
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					borderRadius: 16,
					background: ogPalette.card,
					padding: "40px 28px",
					gap: 16,
				}}
			>
				<div style={{ display: "flex", fontSize: 32, color: ogPalette.mutedForeground }}>
					Discover markets with liquidity rewards
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "baseline",
						fontSize: 160,
						fontWeight: 800,
						lineHeight: 0.8,
						marginTop: 40,
						marginBottom: 40,
						color: ogPalette.positive,
					}}
				>
					{formatNumber(totalDailyRewards, { compact: true, currency: true })}+
					<span style={{ fontSize: 40, fontWeight: 500, color: ogPalette.mutedForeground, marginLeft: 10 }}>/day</span>
				</div>
				<span style={{ fontSize: 20, color: ogPalette.mutedForeground }}>Analyze the best markets to earn rewards on explorer.struct.to</span>
			</div>
		</div>,
		size,
	);
}
