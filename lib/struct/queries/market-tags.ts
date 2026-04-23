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
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

import { normalizeMarketResponseImages } from "@/lib/image-url";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import {
	defaultPageSize,
	logPaginationLimitReached,
	maxPaginationRequests,
	type PaginatedResult,
} from "@/lib/struct/queries/_shared";

export const structAllTagsCacheTag = "struct-all-tags-v2";
export const structTagBySlugCacheTag = "struct-tag-by-slug-v2";
export const structMarketsByTagCacheTag = "struct-markets-by-tag-v2";

function hasTagSlug(tag: Tag): tag is Tag & { slug: string } {
	return typeof tag.slug === "string" && tag.slug.length > 0;
}

export async function getAllTags(
	sort?: TagSortBy,
	timeframe?: TagSortTimeframe,
): Promise<Tag[]> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structAllTagsCacheTag);

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
}

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

export async function getTagCount(): Promise<number> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structAllTagsCacheTag);

	const tags = (await getAllTags()).filter(hasTagSlug);
	return tags.length;
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structTagBySlugCacheTag);

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
}

export async function getMarketsByTag(
	tag: string,
	limit: number = defaultPageSize,
	cursor?: string,
	sortBy: string = "volume",
	sortDir: string = "desc",
	status: "open" | "closed" | "all" = "open",
): Promise<PaginatedResult<MarketResponse>> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structMarketsByTagCacheTag);

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
}
