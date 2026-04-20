import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/site-metadata";
import { parsePageParam } from "@/lib/pagination";
import { TagGridPage } from "@/components/tags/tag-grid-page";
import { parseTagSort, parseTagTimeframe } from "@/lib/struct/tag-shared";

export const revalidate = 3600;

type Props = {
	params: Promise<{ page: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

	const resolved = await searchParams;
	const sort = parseTagSort(resolved.sort);
	const timeframe = parseTagTimeframe(resolved.timeframe);
	const query = typeof resolved.q === "string" ? resolved.q : undefined;

	return <TagGridPage page={page} sort={sort} timeframe={timeframe} query={query} />;
}
