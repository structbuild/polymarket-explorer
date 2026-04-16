import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { formatCapitalizeWords } from "@/lib/format";
import { loadImageAsDataUrl, OgCollectionLayout, ogFloatingPositions, ogImageSize } from "@/lib/opengraph";
import { getTagBySlug, getMarketsByTag } from "@/lib/struct/market-queries";

export const runtime = "nodejs";
export const revalidate = 7200;
export const size = ogImageSize;
export const contentType = "image/png";
export const alt = "Polymarket tag overview";

type Props = {
	params: Promise<{ slug: string }>;
};

export default async function OpenGraphImage({ params }: Props) {
	const { slug: rawSlug } = await params;
	const slug = decodeURIComponent(rawSlug);
	const tag = await getTagBySlug(slug);

	if (!tag) {
		notFound();
	}

	const { data: markets } = await getMarketsByTag(tag.label, ogFloatingPositions.length);
	const tagDisplay = formatCapitalizeWords(tag.label);

	const marketsWithImages = markets.filter((m) => m.image_url).slice(0, ogFloatingPositions.length);
	const imageDataUrls = await Promise.all(marketsWithImages.map((m) => loadImageAsDataUrl(m.image_url, 128)));

	return new ImageResponse(
		<OgCollectionLayout
			subtitle="Prediction Markets"
			title={tagDisplay}
			images={imageDataUrls}
		/>,
		size,
	);
}
