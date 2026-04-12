export const TAGS_PAGE_SIZE = 50;

export function getPageCount(total: number, pageSize: number): number {
	return Math.max(1, Math.ceil(total / pageSize));
}

export function parsePageParam(param: string): number | null {
	const n = Number(param);
	if (!Number.isInteger(n) || n < 1) return null;
	return n;
}
