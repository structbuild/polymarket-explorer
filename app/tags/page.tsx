import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/site-metadata";
import { TagGridPage } from "@/components/tags/tag-grid-page";
import { parseTagSort, parseTagTimeframe } from "@/lib/struct/tag-shared";

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
	title: "Prediction Market Tags",
	description: "Browse Polymarket tags and topics, including politics, crypto, sports, and more.",
	canonical: "/tags",
});

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TagIndexPage({ searchParams }: Props) {
	const resolved = await searchParams;
	const sort = parseTagSort(resolved.sort);
	const timeframe = parseTagTimeframe(resolved.timeframe);
	const query = typeof resolved.q === "string" ? resolved.q : undefined;
	return <TagGridPage page={1} sort={sort} timeframe={timeframe} query={query} />;
}
