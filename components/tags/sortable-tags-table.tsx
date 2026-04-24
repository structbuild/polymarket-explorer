"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import type { Tag, TagSortBy, TagSortTimeframe } from "@structbuild/sdk";

import { TagsTable } from "@/components/tags/tags-table";
import {
	DEFAULT_TAG_SORT,
	DEFAULT_TAG_TIMEFRAME,
	resolveTagSortForTimeframe,
} from "@/lib/struct/tag-shared";

type SortableTagsTableProps = {
	tags: Tag[];
	sort: TagSortBy;
	timeframe: TagSortTimeframe;
	rankOffset?: number;
	toolbarLeft?: React.ReactNode;
	toolbarRight?: React.ReactNode;
};

const LISTING_PATH = "/tags";

export function SortableTagsTable({
	tags,
	sort,
	timeframe,
	rankOffset,
	toolbarLeft,
	toolbarRight,
}: SortableTagsTableProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

	const navigate = useCallback(
		(patch: { sort?: TagSortBy; timeframe?: TagSortTimeframe }) => {
			const params = new URLSearchParams(searchParams.toString());
			const nextTimeframe = patch.timeframe ?? timeframe;
			const nextSort = resolveTagSortForTimeframe(patch.sort ?? sort, nextTimeframe);
			if (nextSort === DEFAULT_TAG_SORT) {
				params.delete("sort");
			} else {
				params.set("sort", nextSort);
			}
			if (nextTimeframe === DEFAULT_TAG_TIMEFRAME) {
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
		[router, searchParams, sort, timeframe],
	);

	const handleSortChange = useCallback(
		(nextSortBy: TagSortBy) => {
			if (nextSortBy === sort) return;
			navigate({ sort: nextSortBy });
		},
		[navigate, sort],
	);

	const handleTimeframeChange = useCallback(
		(nextTimeframe: TagSortTimeframe) => {
			navigate({ timeframe: nextTimeframe });
		},
		[navigate],
	);

	return (
		<TagsTable
			tags={tags}
			sort={sort}
			timeframe={timeframe}
			rankOffset={rankOffset}
			toolbarLeft={toolbarLeft}
			toolbarRight={toolbarRight}
			onSortChange={handleSortChange}
			onTimeframeChange={handleTimeframeChange}
		/>
	);
}
