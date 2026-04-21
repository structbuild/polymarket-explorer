import "server-only";

import type {
	HttpClient,
	MarketResponse,
	MarketSortBy,
	SortDirection,
	Tag,
	TagSortBy,
	TagSortTimeframe,
} from "@structbuild/sdk";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { normalizeMarketResponseImages } from "@/lib/image-url";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import {
	defaultPageSize,
	logPaginationLimitReached,
	maxPaginationRequests,
	type PaginatedResult,
	shortRevalidateSeconds,
} from "@/lib/struct/queries/_shared";

const structAllTagsCacheVersion = "v2";
const structTagBySlugCacheVersion = "v2";
const structMarketsByTagCacheVersion = "v2";

export const structAllTagsCacheTag = `struct-all-tags-${structAllTagsCacheVersion}`;
export const structTagBySlugCacheTag = `struct-tag-by-slug-${structTagBySlugCacheVersion}`;
export const structMarketsByTagCacheTag = `struct-markets-by-tag-${structMarketsByTagCacheVersion}`;

function hasTagSlug(tag: Tag): tag is Tag & { slug: string } {
	return typeof tag.slug === "string" && tag.slug.length > 0;
}

export const getAllTags = cache(
	unstable_cache(
		async (sort?: TagSortBy, timeframe?: TagSortTimeframe): Promise<Tag[]> => {
			const client = getStructClient();

			if (!client) {
				return [];
			}

			const results: Tag[] = [];
			let offset = 0;
			const batchSize = 250;
			const sortParams = sort
				? { sort, timeframe: timeframe ?? ("lifetime" as TagSortTimeframe) }
				: undefined;

			try {
				let requestCount = 0;

				do {
					if (requestCount >= maxPaginationRequests) {
						logPaginationLimitReached("getAllTags");
						break;
					}

					const response = await client.tags.getTags({
						limit: batchSize,
						offset,
						...sortParams,
					});
					results.push(...response.data);
					requestCount += 1;

					if (response.data.length < batchSize) break;

					offset += batchSize;
				} while (true);

				return results;
			} catch (error) {
				logStructError("getAllTags", error);
				return results;
			}
		},
		[structAllTagsCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structAllTagsCacheTag] },
	),
);

export const getTagsPaginated = cache(
	async (
		limit: number = defaultPageSize,
		offset: number = 0,
		sort?: TagSortBy,
		timeframe?: TagSortTimeframe,
	): Promise<PaginatedResult<Tag>> => {
		const tags = (await getAllTags(sort, timeframe)).filter(hasTagSlug);
		const data = tags.slice(offset, offset + limit);
		const hasMore = offset + limit < tags.length;

		return {
			data,
			hasMore,
			nextCursor: hasMore ? String(offset + limit) : null,
		};
	},
);

export const searchTags = cache(
	async (
		query: string,
		sort?: TagSortBy,
		timeframe?: TagSortTimeframe,
	): Promise<Tag[]> => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		const tags = (await getAllTags(sort, timeframe)).filter(hasTagSlug);
		return tags.filter((tag) => tag.label.toLowerCase().includes(q));
	},
);

export const getTagCount = cache(
	unstable_cache(
		async (): Promise<number> => {
			const tags = (await getAllTags()).filter(hasTagSlug);
			return tags.length;
		},
		[`struct-tag-count-${structAllTagsCacheVersion}`],
		{ revalidate: shortRevalidateSeconds, tags: [structAllTagsCacheTag] },
	),
);

export const getTagBySlug = cache(
	unstable_cache(
		async (slug: string): Promise<Tag | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const http = (client.tags as unknown as { http: HttpClient }).http;
				const response = await http.get<Tag>(
					`/polymarket/tags/${encodeURIComponent(slug)}`,
					{ params: { include_metrics: true, timeframe: "lifetime" } },
				);
				return response.data;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getTagBySlug:${slug}`, error);
				return null;
			}
		},
		[structTagBySlugCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structTagBySlugCacheTag] },
	),
);

export const getMarketsByTag = cache(
	unstable_cache(
		async (tag: string, limit: number = defaultPageSize, cursor?: string, sortBy: string = "volume", sortDir: string = "desc", status: "open" | "closed" | "all" = "open"): Promise<PaginatedResult<MarketResponse>> => {
			const client = getStructClient();

			if (!client) {
				return { data: [], hasMore: false, nextCursor: null };
			}

			try {
				const response = await client.markets.getMarkets({
					tags: tag,
					limit,
					sort_by: sortBy as MarketSortBy,
					sort_dir: sortDir as SortDirection,
					status,
					include_metrics: true,
					...(cursor ? { pagination_key: cursor } : {}),
				});
				const hasMore = response.pagination?.has_more ?? false;
				const nextKey = response.pagination?.pagination_key;
				return {
					data: response.data.map(normalizeMarketResponseImages),
					hasMore,
					nextCursor: hasMore && nextKey != null ? String(nextKey) : null,
				};
			} catch (error) {
				if (readStatus(error) === 404) {
					return { data: [], hasMore: false, nextCursor: null };
				}

				logStructError(`getMarketsByTag:${tag}`, error);
				return { data: [], hasMore: false, nextCursor: null };
			}
		},
		[structMarketsByTagCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structMarketsByTagCacheTag] },
	),
);
