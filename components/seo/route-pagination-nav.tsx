import type { Route } from "next";
import Link from "next/link";

type RoutePaginationNavProps = {
	basePath: string;
	currentPage: number;
	totalPages: number;
};

type PaginationItem = number | "ellipsis";

function pageHref(basePath: string, page: number) {
	return (page === 1 ? basePath : `${basePath}/page/${page}`) as Route;
}

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	if (currentPage <= 4) {
		return [1, 2, 3, 4, 5, "ellipsis", totalPages];
	}

	if (currentPage >= totalPages - 3) {
		return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
	}

	return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

const linkClass =
	"inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent";
const activeClass =
	"inline-flex items-center justify-center rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground";
const disabledClass =
	"inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground opacity-50";
const ellipsisClass =
	"inline-flex items-center justify-center px-2 py-2 text-sm text-muted-foreground";

export function RoutePaginationNav({ basePath, currentPage, totalPages }: RoutePaginationNavProps) {
	if (totalPages <= 1) return null;

	const hasPrev = currentPage > 1;
	const hasNext = currentPage < totalPages;
	const items = getPaginationItems(currentPage, totalPages);

	return (
		<nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
			{hasPrev ? (
				<Link href={pageHref(basePath, currentPage - 1)} rel="prev" className={linkClass}>
					Previous
				</Link>
			) : (
				<span className={disabledClass}>Previous</span>
			)}

			{items.map((item, index) =>
				item === "ellipsis" ? (
					<span key={`ellipsis-${index}`} aria-hidden="true" className={ellipsisClass}>
						...
					</span>
				) : item === currentPage ? (
					<span key={item} aria-current="page" className={activeClass}>
						{item}
					</span>
				) : (
					<Link key={item} href={pageHref(basePath, item)} className={linkClass}>
						{item}
					</Link>
				),
			)}

			{hasNext ? (
				<Link href={pageHref(basePath, currentPage + 1)} rel="next" className={linkClass}>
					Next
				</Link>
			) : (
				<span className={disabledClass}>Next</span>
			)}
		</nav>
	);
}
