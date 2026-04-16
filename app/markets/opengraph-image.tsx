import { ImageResponse } from "next/og";
import { deduplicateByImage, loadImageAsDataUrl, OgCollectionLayout, ogFloatingPositions, ogImageSize } from "@/lib/opengraph";
import { getTopMarkets } from "@/lib/struct/market-queries";

export const runtime = "nodejs";
export const revalidate = 7200;
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Polymarket prediction markets";

export default async function OpenGraphImage() {
	const { data: markets } = await getTopMarkets(ogFloatingPositions.length);

	const marketsWithImages = deduplicateByImage(markets, ogFloatingPositions.length);
	const imageDataUrls = await Promise.all(marketsWithImages.map((m) => loadImageAsDataUrl(m.image_url, 128)));

	return new ImageResponse(
		<OgCollectionLayout
			subtitle="Explore Polymarket"
			title="Markets"
			images={imageDataUrls}
		/>,
		size,
	);
}
