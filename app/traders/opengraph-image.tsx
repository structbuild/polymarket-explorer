import { ImageResponse } from "next/og";
import { loadImageAsDataUrl, OgCollectionLayout, ogFloatingPositions, ogImageSize } from "@/lib/opengraph";
import { getGlobalLeaderboard } from "@/lib/struct/market-queries";

export const runtime = "nodejs";
export const revalidate = 7200;
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Top Polymarket traders";

export default async function OpenGraphImage() {
	const { data: entries } = await getGlobalLeaderboard("lifetime", 100);

	const withPfp = entries.filter((e) => e.trader.profile_image).slice(0, ogFloatingPositions.length);
	const imageDataUrls = await Promise.all(withPfp.map((e) => loadImageAsDataUrl(e.trader.profile_image, 128)));

	return new ImageResponse(
		<OgCollectionLayout
			subtitle="Top Polymarket"
			title="Traders"
			images={imageDataUrls}
		/>,
		size,
	);
}
