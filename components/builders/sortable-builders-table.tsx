"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useId, useMemo, useState, useTransition } from "react";
import type { BuilderLatestRowWithMetadata, BuilderSortBy, BuilderTimeframe } from "@structbuild/sdk";

import {
	BuildersTable,
	type BuilderRowWithDisplayRank,
} from "@/components/builders/builders-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DEFAULT_BUILDER_SORT, DEFAULT_BUILDER_TIMEFRAME } from "@/lib/struct/builder-shared";

type SortableBuildersTableProps = {
	builders: BuilderLatestRowWithMetadata[];
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
	const [showUnnamed, setShowUnnamed] = useState(false);
	const checkboxId = useId();

	const visibleBuilders = useMemo<BuilderRowWithDisplayRank[]>(() => {
		const baseOffset = rankOffset ?? 0;
		const ranked: BuilderRowWithDisplayRank[] = builders.map((builder, index) => ({
			...builder,
			__displayRank: baseOffset + index + 1,
		}));
		if (showUnnamed) return ranked;
		return ranked.filter((builder) => Boolean(builder.metadata?.name?.trim()));
	}, [builders, rankOffset, showUnnamed]);

	const unnamedToggle = (
		<label
			htmlFor={checkboxId}
			className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
		>
			<Checkbox
				id={checkboxId}
				checked={showUnnamed}
				onCheckedChange={(value) => setShowUnnamed(Boolean(value))}
			/>
			Show unnamed builders
		</label>
	);

	const mergedToolbarRight = toolbarRight ? (
		<div className="flex flex-wrap items-center gap-3">
			{unnamedToggle}
			{toolbarRight}
		</div>
	) : (
		unnamedToggle
	);

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
			builders={visibleBuilders}
			sort={sort}
			timeframe={timeframe}
			rankOffset={rankOffset}
			pageIndex={pageIndex}
			pageSize={pageSize}
			hasNextPage={hasNextPage}
			toolbarLeft={toolbarLeft}
			toolbarRight={mergedToolbarRight}
			onSortChange={handleSortChange}
			onPageIndexChange={handlePageIndexChange}
		/>
	);
}
