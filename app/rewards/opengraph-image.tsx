import { ImageResponse } from "next/og";
import { formatNumber } from "@/lib/format";
import { deduplicateByImage, loadImageAsDataUrl, OgCollectionLayout, ogFloatingPositions, ogImageSize, ogPalette } from "@/lib/opengraph";
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

	const marketsWithImages = deduplicateByImage(markets, ogFloatingPositions.length);
	const imageDataUrls = await Promise.all(marketsWithImages.map((m) => loadImageAsDataUrl(m.image_url, 128)));

	return new ImageResponse(
		<OgCollectionLayout
			subtitle="Discover markets with liquidity rewards"
			title={
				<>
					{formatNumber(totalDailyRewards, { compact: true, currency: true })}+
					<span style={{ fontSize: 40, fontWeight: 500, color: ogPalette.mutedForeground, marginLeft: 10, alignSelf: "flex-end", marginBottom: 10 }}>/day</span>
				</>
			}
			titleColor={ogPalette.positive}
			images={imageDataUrls}
		/>,
		size,
	);
}
