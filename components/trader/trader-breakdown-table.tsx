import type { ColumnDef } from "@tanstack/react-table";
import { type ReactNode, useCallback, useState, useTransition } from "react";
import { useQueryStates } from "nuqs";

import { SortableHeader } from "@/components/ui/sortable-header";
import type { PaginatedResource } from "@/lib/struct/types";
import { traderSearchParamParsers, type TraderSearchParams } from "@/lib/trader-search-params";
import { maxTraderPageNumber, type TraderSortDirection } from "@/lib/trader-search-params-shared";

export type BreakdownSortContext<S extends string> = {
	currentSortBy: S;
	currentSortDirection: TraderSortDirection;
	onSortChange: (sortBy: S) => void;
	table?: string;
};

function renderBreakdownHeader<S extends string>(
	title: string,
	sortKey: S,
	ctx: BreakdownSortContext<S>,
): ReactNode {
	return (
		<SortableHeader<S>
			table={ctx.table}
			sortBy={sortKey}
			currentSortBy={ctx.currentSortBy}
			currentSortDirection={ctx.currentSortDirection}
			onSortChange={ctx.onSortChange}
		>
			{title}
		</SortableHeader>
	);
}

export function sortableHeader<S extends string, T>(
	title: string,
	sortKey: S | undefined,
	ctx: BreakdownSortContext<S>,
): ColumnDef<T, unknown>["header"] {
	if (!sortKey) return title;
	return () => renderBreakdownHeader(title, sortKey, ctx);
}

type SearchParamKeys = {
	page: keyof TraderSearchParams;
	sortBy: keyof TraderSearchParams;
	sortDirection: keyof TraderSearchParams;
};

type FetchPageResult<R> = { page: PaginatedResource<R, number>; pageNumber: number };

type UseTraderBreakdownTableArgs<S extends string, R> = {
	address: string;
	page: PaginatedResource<R, number>;
	pageNumber: number;
	sortBy: S;
	sortDirection: TraderSortDirection;
	paramKeys: SearchParamKeys;
	fetchPage: (args: {
		address: string;
		pageNumber: number;
		sortBy: S;
		sortDirection: TraderSortDirection;
	}) => Promise<FetchPageResult<R>>;
};

export function useTraderBreakdownTable<S extends string, R>({
	address,
	page,
	pageNumber,
	sortBy,
	sortDirection,
	paramKeys,
	fetchPage,
}: UseTraderBreakdownTableArgs<S, R>) {
	const [isPending, startTransition] = useTransition();
	const [tableState, setTableState] = useState(() => ({
		sourcePage: page,
		sourcePageNumber: pageNumber,
		sourceSortBy: sortBy,
		sourceSortDirection: sortDirection,
		page,
		pageNumber,
		sortBy,
		sortDirection,
	}));
	const [, setSearchParams] = useQueryStates(traderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: true,
		startTransition,
	});

	const hasLocalState =
		tableState.sourcePage === page &&
		tableState.sourcePageNumber === pageNumber &&
		tableState.sourceSortBy === sortBy &&
		tableState.sourceSortDirection === sortDirection;
	const currentPage = hasLocalState ? tableState.page : page;
	const currentPageNumber = hasLocalState ? tableState.pageNumber : pageNumber;
	const currentSortBy = hasLocalState ? tableState.sortBy : sortBy;
	const currentSortDirection = hasLocalState ? tableState.sortDirection : sortDirection;

	const loadPage = useCallback(
		(nextPageNumber: number, nextSortBy: S, nextSortDirection: TraderSortDirection) => {
			startTransition(async () => {
				void setSearchParams({
					[paramKeys.page]: nextPageNumber,
					[paramKeys.sortBy]: nextSortBy,
					[paramKeys.sortDirection]: nextSortDirection,
				} as Partial<TraderSearchParams>);

				const result = await fetchPage({
					address,
					pageNumber: nextPageNumber,
					sortBy: nextSortBy,
					sortDirection: nextSortDirection,
				});

				setTableState({
					sourcePage: page,
					sourcePageNumber: pageNumber,
					sourceSortBy: sortBy,
					sourceSortDirection: sortDirection,
					page: result.page,
					pageNumber: result.pageNumber,
					sortBy: nextSortBy,
					sortDirection: nextSortDirection,
				});
			});
		},
		[address, fetchPage, page, pageNumber, paramKeys, setSearchParams, sortBy, sortDirection],
	);

	const handleSortChange = useCallback(
		(nextSortBy: S) => {
			const nextSortDirection: TraderSortDirection =
				nextSortBy === currentSortBy && currentSortDirection === "desc" ? "asc" : "desc";
			loadPage(1, nextSortBy, nextSortDirection);
		},
		[currentSortBy, currentSortDirection, loadPage],
	);

	const onPageIndexChange = useCallback(
		(nextPageIndex: number) => {
			const nextPageNumber = Math.min(Math.max(nextPageIndex + 1, 1), maxTraderPageNumber);
			if (nextPageNumber === currentPageNumber) return;
			loadPage(nextPageNumber, currentSortBy, currentSortDirection);
		},
		[currentPageNumber, currentSortBy, currentSortDirection, loadPage],
	);

	return {
		isPending,
		startTransition,
		currentPage,
		currentPageNumber,
		currentSortBy,
		currentSortDirection,
		handleSortChange,
		onPageIndexChange,
	};
}
