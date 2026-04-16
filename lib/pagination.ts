export const TAGS_PAGE_SIZE = 50;

export function getPageCount(total: number, pageSize: number): number {
	if (!Number.isFinite(total) || !Number.isInteger(pageSize) || pageSize <= 0) {
		return 1;
	}

	return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}

export function parsePageParam(param: string): number | null {
	if (!/^[1-9]\d*$/.test(param)) return null;

	return Number.parseInt(param, 10);
}
