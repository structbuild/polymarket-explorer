import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { buildPageMetadata } from "@/lib/site-metadata";
import { getPageCount, parsePageParam, TAGS_PAGE_SIZE } from "@/lib/pagination";
import { TagGridPage } from "@/components/tags/tag-grid-page";
import { parseTagSort, parseTagTimeframe } from "@/lib/struct/tag-shared";
import { getTagCount } from "@/lib/struct/market-queries";

type Props = {
	params: Promise<{ page: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
	const totalPages = getPageCount(await getTagCount(), TAGS_PAGE_SIZE);
	return [{ page: String(totalPages > 1 ? 2 : 1) }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { page: raw } = await params;
	const page = parsePageParam(raw);

	if (!page || page === 1) return {};

	return buildPageMetadata({
		title: `Polymarket Categories · Page ${page}`,
		description: `Browse Polymarket prediction market categories, page ${page} — politics, crypto, sports, culture, and more.`,
		canonical: `/tags/page/${page}`,
	});
}

export default async function TagPaginatedPage({ params, searchParams }: Props) {
	const { page: raw } = await params;
	const page = parsePageParam(raw);

	if (!page) notFound();
	if (page === 1) redirect("/tags");

	return (
		<Suspense fallback={<TagPaginatedPageFallback />}>
			<TagPaginatedPageContent page={page} searchParams={searchParams} />
		</Suspense>
	);
}

async function TagPaginatedPageContent({
	page,
	searchParams,
}: {
	page: number;
	searchParams: Props["searchParams"];
}) {
	const resolved = await searchParams;
	const sort = parseTagSort(resolved.sort);
	const timeframe = parseTagTimeframe(resolved.timeframe);
	const query = typeof resolved.q === "string" ? resolved.q : undefined;

	return <TagGridPage page={page} sort={sort} timeframe={timeframe} query={query} />;
}

function TagPaginatedPageFallback() {
	return (
		<div className="space-y-4">
			<div className="h-8 w-40 animate-pulse rounded bg-muted" />
			<div className="h-4 w-64 animate-pulse rounded bg-muted" />
		</div>
	);
}
