"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import type { BuilderLatestRow, BuilderSortBy, BuilderTimeframe } from "@structbuild/sdk";

import { BuildersTable } from "@/components/builders/builders-table";
import { DEFAULT_BUILDER_SORT, DEFAULT_BUILDER_TIMEFRAME } from "@/lib/struct/builder-shared";

type SortableBuildersTableProps = {
	builders: BuilderLatestRow[];
	sort: BuilderSortBy;
	timeframe: BuilderTimeframe;
	rankOffset?: number;
	pageIndex: number;
	pageSize: number;
	hasNextPage: boolean;
	toolbarLeft?: React.ReactNode;
	toolbarRight?: React.ReactNode;
};

const LISTING_PATH = "/builders";

export function SortableBuildersTable({
	builders,
	sort,
	timeframe,
	rankOffset,
	pageIndex,
	pageSize,
	hasNextPage,
	toolbarLeft,
	toolbarRight,
}: SortableBuildersTableProps) {
	const router = useRouter();
	const [, startTransition] = useTransition();

	const navigate = useCallback(
		(patch: { sort?: BuilderSortBy; timeframe?: BuilderTimeframe }) => {
			const params = new URLSearchParams(window.location.search);
			const nextSort = patch.sort ?? (params.get("sort") as BuilderSortBy | null) ?? sort;
			const nextTimeframe =
				patch.timeframe ?? (params.get("timeframe") as BuilderTimeframe | null) ?? timeframe;
			if (nextSort === DEFAULT_BUILDER_SORT) {
				params.delete("sort");
			} else {
				params.set("sort", nextSort);
			}
			if (nextTimeframe === DEFAULT_BUILDER_TIMEFRAME) {
				params.delete("timeframe");
			} else {
				params.set("timeframe", nextTimeframe);
			}
			params.delete("page");
			const qs = params.toString();
			const href = (qs ? `${LISTING_PATH}?${qs}` : LISTING_PATH) as Route;
			startTransition(() => {
				router.replace(href, { scroll: false });
			});
		},
		[router, sort, timeframe],
	);

	const handleSortChange = useCallback(
		(nextSortBy: BuilderSortBy) => {
			if (nextSortBy === sort) return;
			navigate({ sort: nextSortBy });
		},
		[navigate, sort],
	);

	const handlePageIndexChange = useCallback(
		(nextPageIndex: number) => {
			const nextPage = Math.max(1, nextPageIndex + 1);
			const params = new URLSearchParams(window.location.search);
			if (nextPage === 1) {
				params.delete("page");
			} else {
				params.set("page", String(nextPage));
			}
			const qs = params.toString();
			const href = (qs ? `${LISTING_PATH}?${qs}` : LISTING_PATH) as Route;
			startTransition(() => {
				router.replace(href, { scroll: false });
			});
		},
		[router],
	);

	return (
		<BuildersTable
			builders={builders}
			sort={sort}
			timeframe={timeframe}
			rankOffset={rankOffset}
			pageIndex={pageIndex}
			pageSize={pageSize}
			hasNextPage={hasNextPage}
			toolbarLeft={toolbarLeft}
			toolbarRight={toolbarRight}
			onSortChange={handleSortChange}
			onPageIndexChange={handlePageIndexChange}
		/>
	);
}
