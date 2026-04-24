import type { Metadata } from "next";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/site-metadata";
import { TagGridPage } from "@/components/tags/tag-grid-page";
import { TagIndexPageFallback } from "@/components/tags/tag-index-page-fallback";
import { parseTagSort, parseTagTimeframe } from "@/lib/struct/tag-shared";

export const metadata: Metadata = buildPageMetadata({
	title: "Polymarket Categories · Politics, Crypto, Sports & More",
	description:
		"Browse Polymarket prediction markets by topic — politics, crypto, sports, culture, and more. Sorted by live volume and activity.",
	canonical: "/tags",
});

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function TagIndexPage({ searchParams }: Props) {
	return (
		<Suspense fallback={<TagIndexPageFallback />}>
			<TagIndexPageContent searchParams={searchParams} />
		</Suspense>
	);
}

async function TagIndexPageContent({ searchParams }: Props) {
	const resolved = await searchParams;
	const sort = parseTagSort(resolved.sort);
	const timeframe = parseTagTimeframe(resolved.timeframe);
	const query = typeof resolved.q === "string" ? resolved.q : undefined;
	return <TagGridPage page={1} sort={sort} timeframe={timeframe} query={query} />;
}
