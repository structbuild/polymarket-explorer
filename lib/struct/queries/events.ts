import "server-only";

import type {
	Event,
	EventMarketChartOutcome,
	EventMetricsResponse,
	MarketStatus,
	MetricsTimeframe,
	SortDirection,
} from "@structbuild/sdk";

import { normalizeMarketResponseImages } from "@/lib/image-url";
import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import {
	defaultPageSize,
	logPaginationLimitReached,
	maxPaginationRequests,
	type PaginatedResult,
} from "@/lib/struct/queries/_shared";

export type EventChartResolution = "1H" | "6H" | "1D" | "1W" | "1M" | "ALL";

export type EventSortBy =
	| "volume"
	| "txns"
	| "unique_traders"
	| "title"
	| "creation_date"
	| "start_date"
	| "end_date"
	| "relevance";

function normalizeEvent(event: Event): Event {
	const normalized = normalizeMarketResponseImages(event);
	const markets = event.markets;
	if (!markets || markets.length === 0) {
		return normalized;
	}
	return {
		...normalized,
		markets: markets.map((m) => normalizeMarketResponseImages(m)),
	};
}

export async function getTopEvents(
	limit: number = defaultPageSize,
	status: MarketStatus = "open",
	cursor?: string,
	sortBy: EventSortBy = "volume",
	sortDir: SortDirection = "desc",
	timeframe: MetricsTimeframe = "24h",
): Promise<PaginatedResult<Event>> {
	const client = getStructClient();

	if (!client) {
		return { data: [], hasMore: false, nextCursor: null };
	}

	try {
		const response = await client.events.getEvents({
			limit,
			status,
			sort_by: sortBy,
			sort_dir: sortDir,
			timeframe,
			include_metrics: true,
			include_markets: true,
			include_tags: true,
			...(cursor ? { pagination_key: cursor } : {}),
		});
		const hasMore = response.pagination?.has_more ?? false;
		const nextKey = response.pagination?.pagination_key;
		return {
			data: response.data.map(normalizeEvent),
			hasMore,
			nextCursor: hasMore && nextKey != null ? String(nextKey) : null,
		};
	} catch (error) {
		logStructError(`getTopEvents:${status}`, error);
		return { data: [], hasMore: false, nextCursor: null };
	}
}

export async function getEventsByTag(
	tagSlug: string,
	limit: number = defaultPageSize,
	status: MarketStatus = "open",
	cursor?: string,
	sortBy: EventSortBy = "volume",
	sortDir: SortDirection = "desc",
	timeframe: MetricsTimeframe = "24h",
): Promise<PaginatedResult<Event>> {
	const client = getStructClient();

	if (!client || !tagSlug) {
		return { data: [], hasMore: false, nextCursor: null };
	}

	try {
		const response = await client.events.getEvents({
			tags: tagSlug,
			limit,
			status,
			sort_by: sortBy,
			sort_dir: sortDir,
			timeframe,
			include_metrics: true,
			include_markets: true,
			include_tags: true,
			...(cursor ? { pagination_key: cursor } : {}),
		});
		const hasMore = response.pagination?.has_more ?? false;
		const nextKey = response.pagination?.pagination_key;
		return {
			data: response.data.map(normalizeEvent),
			hasMore,
			nextCursor: hasMore && nextKey != null ? String(nextKey) : null,
		};
	} catch (error) {
		if (readStatus(error) === 404) {
			return { data: [], hasMore: false, nextCursor: null };
		}

		logStructError(`getEventsByTag:${tagSlug}`, error);
		return { data: [], hasMore: false, nextCursor: null };
	}
}

export type EventTagFrequency = { slug: string; label: string; count: number };

export async function getEventTagFrequencies(
	sampleSize: number = 60,
	max: number = 40,
): Promise<EventTagFrequency[]> {
	const client = getStructClient();
	if (!client) return [];

	try {
		const response = await client.events.getEvents({
			limit: sampleSize,
			status: "open",
			sort_by: "volume",
			sort_dir: "desc",
			timeframe: "lifetime",
			include_tags: true,
			include_markets: false,
			include_metrics: false,
		});
		const tally = new Map<string, EventTagFrequency>();
		for (const event of response.data) {
			for (const tag of event.tags ?? []) {
				const label = tag.label;
				const slug = tag.slug;
				if (!slug || typeof label !== "string" || label.length === 0) continue;
				if (slug.startsWith("hide-from-")) continue;
				const existing = tally.get(slug);
				if (existing) {
					existing.count += 1;
				} else {
					tally.set(slug, { slug, label, count: 1 });
				}
			}
		}
		return Array.from(tally.values())
			.sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label))
			.slice(0, max);
	} catch (error) {
		logStructError("getEventTagFrequencies", error);
		return [];
	}
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
	const client = getStructClient();

	if (!client) {
		return null;
	}

	try {
		const response = await client.events.getEventBySlug({ slug });
		const data = response.data;
		return data ? normalizeEvent(data) : null;
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}

		logStructError(`getEventBySlug:${slug}`, error);
		throw error;
	}
}

export async function getEventChart(
	eventSlug: string,
	resolution: EventChartResolution = "1W",
	options?: { conditionIds?: string[]; marketSlugs?: string[] },
): Promise<EventMarketChartOutcome[] | null> {
	const client = getStructClient();

	if (!client || !eventSlug) {
		return null;
	}

	try {
		const response = await client.events.getEventChart({
			event_slug: eventSlug,
			resolution,
			...(options?.conditionIds?.length
				? { condition_ids: options.conditionIds.join(",") }
				: {}),
			...(options?.marketSlugs?.length
				? { market_slugs: options.marketSlugs.join(",") }
				: {}),
		});
		return response.data ?? [];
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}

		logStructError(`getEventChart:${eventSlug}`, error);
		return null;
	}
}

export async function getEventMetrics(
	eventSlug: string,
	timeframe: string = "lifetime",
): Promise<EventMetricsResponse | null> {
	const client = getStructClient();

	if (!client || !eventSlug) {
		return null;
	}

	try {
		const response = await client.events.getEventMetrics({
			event_slug: eventSlug,
			timeframe,
		});
		const data = response.data;
		if (!data) {
			return null;
		}
		return Array.isArray(data) ? (data[0] ?? null) : data;
	} catch (error) {
		if (readStatus(error) === 404) {
			return null;
		}

		logStructError(`getEventMetrics:${eventSlug}`, error);
		return null;
	}
}

export async function getAllEventSlugs(maxCount?: number): Promise<{ slug: string }[]> {
	if (maxCount !== undefined && maxCount <= 0) {
		return [];
	}

	const client = getStructClient();

	if (!client) {
		return [];
	}

	const results: { slug: string }[] = [];
	let paginationKey: string | undefined;

	try {
		const seenPaginationKeys = new Set<string>();
		let requestCount = 0;

		outer: do {
			if (requestCount >= maxPaginationRequests) {
				logPaginationLimitReached("getAllEventSlugs");
				break;
			}

			const response = await client.events.getEvents({
				status: "all",
				sort_by: "volume",
				sort_dir: "desc",
				limit: 100,
				include_markets: false,
				include_metrics: false,
				include_tags: false,
				...(paginationKey ? { pagination_key: paginationKey } : {}),
			});
			requestCount += 1;

			for (const event of response.data) {
				if (event.event_slug) {
					results.push({ slug: event.event_slug });
					if (maxCount !== undefined && results.length >= maxCount) {
						break outer;
					}
				}
			}

			const hasMore = response.pagination?.has_more ?? false;
			const nextKey = response.pagination?.pagination_key;
			paginationKey = hasMore && nextKey != null
				? String(nextKey)
				: undefined;

			if (!hasMore) break;
			if (!paginationKey || seenPaginationKeys.has(paginationKey)) break;

			seenPaginationKeys.add(paginationKey);
		} while (true);

		return results;
	} catch (error) {
		logStructError("getAllEventSlugs", error);
		throw error;
	}
}
