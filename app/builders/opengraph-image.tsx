import { ImageResponse } from "next/og";
import {
	loadImageAsDataUrl,
	OgCollectionLayout,
	ogFloatingPositions,
	ogImageSize,
} from "@/lib/opengraph";
import { getBuildersPaginated } from "@/lib/struct/builder-queries";

export const runtime = "nodejs";
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Top Polymarket builders";

async function loadBuilderOpenGraphImages() {
	const { data: builders } = await getBuildersPaginated(100, 0, "volume", "lifetime");
	const withIcon = builders.filter((b) => b.metadata?.icon_url).slice(0, ogFloatingPositions.length);

	return (
		await Promise.allSettled(withIcon.map((b) => loadImageAsDataUrl(b.metadata?.icon_url, 128)))
	).flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
}

export default async function OpenGraphImage() {
	const imageDataUrls = await loadBuilderOpenGraphImages();

	return new ImageResponse(
		<OgCollectionLayout
			subtitle="Top Polymarket"
			title="Builders"
			images={imageDataUrls}
		/>,
		size,
	);
}
