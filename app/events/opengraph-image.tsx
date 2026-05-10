import { ImageResponse } from "next/og";
import { deduplicateByImage, loadImageAsDataUrl, OgCollectionLayout, ogFloatingPositions, ogImageSize } from "@/lib/opengraph";
import { getTopEvents } from "@/lib/struct/queries/events";

export const runtime = "nodejs";
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Polymarket events";

async function loadEventOpenGraphImages() {
	const { data: events } = await getTopEvents(ogFloatingPositions.length);
	const eventsWithImages = deduplicateByImage(events, ogFloatingPositions.length);

	return (
		await Promise.allSettled(eventsWithImages.map((e) => loadImageAsDataUrl(e.image_url, 128)))
	).flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
}

export default async function OpenGraphImage() {
	const imageDataUrls = await loadEventOpenGraphImages();

	return new ImageResponse(
		<OgCollectionLayout
			subtitle="Explore Polymarket"
			title="Events"
			images={imageDataUrls}
		/>,
		size,
	);
}
