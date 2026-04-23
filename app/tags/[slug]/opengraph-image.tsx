import { ImageResponse } from "next/og";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { formatCapitalizeWords } from "@/lib/format";
import { deduplicateByImage, loadImageAsDataUrl, OgCollectionLayout, ogCacheLife, ogFloatingPositions, ogImageSize } from "@/lib/opengraph";
import { getTagBySlug, getMarketsByTag } from "@/lib/struct/market-queries";

export const runtime = "nodejs";
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Polymarket tag overview";

type Props = {
	params: Promise<{ slug: string }>;
};

async function loadTagOpenGraphData(slug: string) {
	"use cache";
	cacheLife(ogCacheLife);

	const tag = await getTagBySlug(slug);

	if (!tag) {
		return null;
	}

	const { data: markets } = await getMarketsByTag(tag.label, ogFloatingPositions.length);
	const tagDisplay = formatCapitalizeWords(tag.label);
	const marketsWithImages = deduplicateByImage(markets, ogFloatingPositions.length);
	const imageDataUrls = await Promise.all(marketsWithImages.map((m) => loadImageAsDataUrl(m.image_url, 128)));

	return { imageDataUrls, tagDisplay };
}

export default async function OpenGraphImage({ params }: Props) {
	const { slug: rawSlug } = await params;
	const slug = decodeURIComponent(rawSlug);
	const data = await loadTagOpenGraphData(slug);

	if (!data) {
		notFound();
	}

	return new ImageResponse(
		<OgCollectionLayout
			subtitle="Prediction Markets"
			title={data.tagDisplay}
			images={data.imageDataUrls}
		/>,
		size,
	);
}
