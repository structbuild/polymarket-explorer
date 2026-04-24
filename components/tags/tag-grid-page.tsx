import { notFound } from "next/navigation";
import type { TagSortBy, TagSortTimeframe } from "@structbuild/sdk";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RoutePaginationNav } from "@/components/seo/route-pagination-nav";
import { SortableTagsTable } from "@/components/tags/sortable-tags-table";
import { TagSearchInput } from "@/components/tags/tag-search-input";
import { getSiteUrl } from "@/lib/env";
import { TAGS_PAGE_SIZE, getPageCount } from "@/lib/pagination";
import { SITE_NAME } from "@/lib/site-metadata";
import {
	DEFAULT_TAG_SORT,
	DEFAULT_TAG_TIMEFRAME,
	resolveTagSortForTimeframe,
} from "@/lib/struct/tag-shared";
import {
	getTagsPaginated,
	getTagCount,
	searchTags,
} from "@/lib/struct/market-queries";

type TagGridPageProps = {
	page: number;
	sort?: TagSortBy;
	timeframe?: TagSortTimeframe;
	query?: string;
};

export async function TagGridPage({
	page,
	sort,
	timeframe,
	query,
}: TagGridPageProps) {
	const effectiveTimeframe = timeframe ?? DEFAULT_TAG_TIMEFRAME;
	const effectiveSort = resolveTagSortForTimeframe(sort ?? DEFAULT_TAG_SORT, effectiveTimeframe);
	const trimmedQuery = query?.trim() ?? "";
	const isSearching = trimmedQuery.length > 0;

	const tags = isSearching
		? await searchTags(trimmedQuery, effectiveSort, effectiveTimeframe)
		: null;
	const paginated = isSearching
		? null
		: await getTagsPaginated(
				TAGS_PAGE_SIZE,
				(page - 1) * TAGS_PAGE_SIZE,
				effectiveSort,
				effectiveTimeframe,
			);
	const totalTags = isSearching ? tags!.length : await getTagCount();

	const totalPages = isSearching ? 1 : getPageCount(totalTags, TAGS_PAGE_SIZE);

	if (!isSearching && page > totalPages && page !== 1) {
		notFound();
	}

	const displayTags = isSearching ? tags! : paginated!.data.filter((tag) => tag.slug);

	const breadcrumbs = [
		{ label: "Home", href: "/" },
		{ label: "Tags", href: "/tags" },
		...(page > 1 ? [{ label: `Page ${page}`, href: `/tags/page/${page}` }] : []),
	];

	const siteUrl = getSiteUrl();
	const canonicalPath = page > 1 ? `/tags/page/${page}` : "/tags";
	const positionOffset = isSearching ? 0 : (page - 1) * TAGS_PAGE_SIZE;
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
					toolbarRight={<TagSearchInput query={trimmedQuery} />}
				/>
			</div>

			{isSearching ? null : (
				<RoutePaginationNav
					basePath="/tags"
					currentPage={page}
					totalPages={totalPages}
					searchParams={paginationParams}
				/>
			)}
		</div>
	);
}
