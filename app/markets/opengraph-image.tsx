import { ImageResponse } from "next/og";
import { deduplicateByImage, loadImageAsDataUrl, OgCollectionLayout, ogFloatingPositions, ogImageSize } from "@/lib/opengraph";
import { getTopMarkets } from "@/lib/struct/market-queries";

export const runtime = "nodejs";
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Polymarket prediction markets";

async function loadMarketOpenGraphImages() {
	const { data: markets } = await getTopMarkets(ogFloatingPositions.length);
	const marketsWithImages = deduplicateByImage(markets, ogFloatingPositions.length);

	return (
		await Promise.allSettled(marketsWithImages.map((m) => loadImageAsDataUrl(m.image_url, 128)))
	).flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
}

export default async function OpenGraphImage() {
	const imageDataUrls = await loadMarketOpenGraphImages();

	return new ImageResponse(
		<OgCollectionLayout
			subtitle="Explore Polymarket"
			title="Markets"
			images={imageDataUrls}
		/>,
		size,
	);
}
