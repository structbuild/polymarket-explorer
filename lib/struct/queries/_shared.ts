import "server-only";

import type { PaginatedResource } from "@/lib/struct/types";

export const defaultPageSize = 24;
export const maxPaginationRequests = 1000;

export type PaginatedResult<T> = {
	data: T[];
	hasMore: boolean;
	nextCursor: string | null;
};

export function parseOffsetCursor(cursor: string | undefined): number {
	if (!cursor) return 0;
	const parsed = Number.parseInt(cursor, 10);
	return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function logPaginationLimitReached(label: string) {
	console.error(`Struct SDK pagination aborted after ${maxPaginationRequests} requests: ${label}`);
}

export function emptyOffsetPage<T>(limit: number): PaginatedResource<T, number> {
	return {
		data: [],
		hasMore: false,
		nextCursor: null,
		pageSize: limit,
	};
}
