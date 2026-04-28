"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ChevronsDownIcon } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import type { BuilderLatestRow, BuilderSortBy, BuilderTimeframe } from "@structbuild/sdk";

import { BuildersTable } from "@/components/builders/builders-table";
import { Button } from "@/components/ui/button";
import { DEFAULT_BUILDER_SORT, DEFAULT_BUILDER_TIMEFRAME } from "@/lib/struct/builder-shared";

type SortableBuildersTableProps = {
	builders: BuilderLatestRow[];
	sort: BuilderSortBy;
	timeframe: BuilderTimeframe;
	rankOffset?: number;
	initialLimit?: number;
	toolbarLeft?: React.ReactNode;
	toolbarRight?: React.ReactNode;
};

const LISTING_PATH = "/builders";

export function SortableBuildersTable({
	builders,
	sort,
	timeframe,
	rankOffset,
	initialLimit,
	toolbarLeft,
	toolbarRight,
}: SortableBuildersTableProps) {
	const router = useRouter();
	const [, startTransition] = useTransition();
	const [showAll, setShowAll] = useState(false);
	const isCapped = initialLimit !== undefined && builders.length > initialLimit && !showAll;
	const visibleBuilders = useMemo(
		() => (isCapped ? builders.slice(0, initialLimit) : builders),
		[builders, initialLimit, isCapped],
	);
	const showAllButton =
		initialLimit !== undefined && builders.length > initialLimit && !showAll ? (
			<Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
				<ChevronsDownIcon data-icon="inline-start" />
				Show all
			</Button>
		) : null;

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

	return (
		<div className="space-y-3">
			<BuildersTable
				builders={visibleBuilders}
				sort={sort}
				timeframe={timeframe}
				rankOffset={rankOffset}
				toolbarLeft={toolbarLeft}
				toolbarRight={toolbarRight}
				onSortChange={handleSortChange}
			/>
			{showAllButton ? <div className="flex justify-center">{showAllButton}</div> : null}
		</div>
	);
}
