import { ImageResponse } from "next/og";
import { cacheLife } from "next/cache";
import { loadImageAsDataUrl, OgCollectionLayout, ogCacheLife, ogFloatingPositions, ogImageSize } from "@/lib/opengraph";
import { getGlobalLeaderboard } from "@/lib/struct/market-queries";

export const runtime = "nodejs";
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Top Polymarket traders";

async function loadTraderOpenGraphImages() {
	"use cache";
	cacheLife(ogCacheLife);

	const { data: entries } = await getGlobalLeaderboard("lifetime", 100);
	const withPfp = entries.filter((e) => e.trader.profile_image).slice(0, ogFloatingPositions.length);

	return Promise.all(withPfp.map((e) => loadImageAsDataUrl(e.trader.profile_image, 128)));
}

export default async function OpenGraphImage() {
	const imageDataUrls = await loadTraderOpenGraphImages();

	return new ImageResponse(
		<OgCollectionLayout
			subtitle="Top Polymarket"
			title="Traders"
			images={imageDataUrls}
		/>,
		size,
	);
}
