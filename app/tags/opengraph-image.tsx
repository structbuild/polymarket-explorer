import { ImageResponse } from "next/og";
import { deduplicateByImage, loadImageAsDataUrl, OgCollectionLayout, ogFloatingPositions, ogImageSize } from "@/lib/opengraph";
import { getTopMarkets } from "@/lib/struct/market-queries";

export const runtime = "nodejs";
export const revalidate = 7200;
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Browse Polymarket prediction market tags";

export default async function OpenGraphImage() {
	const { data: markets } = await getTopMarkets(ogFloatingPositions.length);

	const marketsWithImages = deduplicateByImage(markets, ogFloatingPositions.length);
	const imageDataUrls = (
		await Promise.allSettled(marketsWithImages.map((m) => loadImageAsDataUrl(m.image_url, 128)))
	).flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

	return new ImageResponse(
		<OgCollectionLayout
			subtitle="Browse Polymarket"
			title="Tags"
			images={imageDataUrls}
		/>,
		size,
	);
}
