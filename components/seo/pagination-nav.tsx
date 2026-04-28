import type { Route } from "next";
import Link from "next/link";

type PaginationNavProps = {
	basePath: string;
	baseParams?: Record<string, string>;
	page?: number;
	cursor: string | null;
	nextCursor: string | null;
	hasMore: boolean;
};

function buildHref(basePath: string, baseParams: Record<string, string>, cursor: string | null, page?: number) {
	const params = new URLSearchParams(baseParams);
	if (cursor) {
		params.set("cursor", cursor);
	}
	if (page != null && page > 1) {
		params.set("page", String(page));
	}
	const qs = params.toString();
	return (qs ? `${basePath}?${qs}` : basePath) as Route;
}

const linkClass = "inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent";
const disabledClass = "inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50";

export function PaginationNav({ basePath, baseParams = {}, page, cursor, nextCursor, hasMore }: PaginationNavProps) {
	const showPrev = cursor !== null;
	const showNext = hasMore && nextCursor !== null;

	if (!showPrev && !showNext) return null;

	return (
		<nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
			{showPrev ? (
				<Link href={buildHref(basePath, baseParams, null)} prefetch={false} className={linkClass}>
					First page
				</Link>
			) : (
				<span className={disabledClass}>First page</span>
			)}
			{showNext ? (
				<Link href={buildHref(basePath, baseParams, nextCursor, page != null ? page + 1 : undefined)} prefetch={false} className={linkClass}>
					Next page
				</Link>
			) : (
				<span className={disabledClass}>Next page</span>
			)}
		</nav>
	);
}
