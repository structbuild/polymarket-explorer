import { notFound } from "next/navigation";
import type { TagSortBy, TagSortTimeframe } from "@structbuild/sdk";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RoutePaginationNav } from "@/components/seo/route-pagination-nav";
import { SortableTagsTable } from "@/components/tags/sortable-tags-table";
import { getSiteUrl } from "@/lib/env";
import { TAGS_PAGE_SIZE } from "@/lib/pagination";
import { SITE_NAME } from "@/lib/site-metadata";
import { DEFAULT_TAG_SORT, DEFAULT_TAG_TIMEFRAME } from "@/lib/struct/tag-shared";
import {
	getTagsPaginated,
	getTagPageCount,
} from "@/lib/struct/market-queries";

type TagGridPageProps = {
	page: number;
	sort?: TagSortBy;
	timeframe?: TagSortTimeframe;
};

export async function TagGridPage({
	page,
	sort,
	timeframe,
}: TagGridPageProps) {
	const effectiveSort = sort ?? DEFAULT_TAG_SORT;
	const effectiveTimeframe = timeframe ?? DEFAULT_TAG_TIMEFRAME;

	const paginated = await getTagsPaginated(
		TAGS_PAGE_SIZE,
		(page - 1) * TAGS_PAGE_SIZE,
		effectiveSort,
		effectiveTimeframe,
	);
	const totalPages = await getTagPageCount(TAGS_PAGE_SIZE, effectiveSort, effectiveTimeframe);

	if (page > totalPages && page !== 1) {
		notFound();
	}

	const displayTags = paginated.data.filter((tag) => tag.slug);

	const breadcrumbs = [
		{ label: "Home", href: "/" },
		{ label: "Tags", href: "/tags" },
		...(page > 1 ? [{ label: `Page ${page}`, href: `/tags/page/${page}` }] : []),
	];

	const siteUrl = getSiteUrl();
	const canonicalPath = page > 1 ? `/tags/page/${page}` : "/tags";
	const positionOffset = (page - 1) * TAGS_PAGE_SIZE;
	const pageSuffix = page > 1 ? ` — Page ${page}` : "";

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `Prediction Market Tags${pageSuffix} — ${SITE_NAME}`,
		description: `Browse prediction market tags${pageSuffix ? ` (page ${page})` : ""} on ${SITE_NAME}.`,
		url: new URL(canonicalPath, siteUrl).toString(),
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: displayTags.length,
			itemListElement: displayTags.map((tag, index) => ({
				"@type": "ListItem",
				position: positionOffset + index + 1,
				name: tag.label,
				url: new URL(`/tags/${tag.slug}`, siteUrl).toString(),
			})),
		},
	};

	const paginationParams = new URLSearchParams();
	if (sort && sort !== DEFAULT_TAG_SORT) paginationParams.set("sort", sort);
	if (timeframe && timeframe !== DEFAULT_TAG_TIMEFRAME) {
		paginationParams.set("timeframe", timeframe);
	}

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs items={breadcrumbs} />
			<JsonLd data={jsonLd} />

			<div className="mt-6">
				<SortableTagsTable
					tags={displayTags}
					sort={effectiveSort}
					timeframe={effectiveTimeframe}
					rankOffset={positionOffset}
					toolbarLeft={
						<div className="mb-3">
							<h1 className="text-xl font-medium tracking-tight">Tags</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								Browse prediction markets by topic.
							</p>
						</div>
					}
				/>
			</div>

			<RoutePaginationNav
				basePath="/tags"
				currentPage={page}
				totalPages={totalPages}
				searchParams={paginationParams}
			/>
		</div>
	);
}
