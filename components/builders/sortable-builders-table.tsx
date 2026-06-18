"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useId, useMemo, useState, useTransition } from "react";
import posthog from "posthog-js";
import { GitCompareIcon, XIcon } from "lucide-react";
import type { BuilderLatestRowWithMetadata, BuilderSortBy, BuilderTimeframe } from "@structbuild/sdk";

import {
	BuildersTable,
	type BuilderRowWithDisplayRank,
} from "@/components/builders/builders-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MAX_COMPARE_BUILDERS } from "@/lib/builder-compare-search-params-shared";
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
	const [compareMode, setCompareMode] = useState(false);
	const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
	const checkboxId = useId();

	const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);

	const toggleSelect = useCallback((code: string) => {
		const normalized = code.trim().toLowerCase();
		setSelectedCodes((prev) => {
			if (prev.includes(normalized)) {
				return prev.filter((value) => value !== normalized);
			}
			if (prev.length >= MAX_COMPARE_BUILDERS) return prev;
			return [...prev, normalized];
		});
	}, []);

	const isSelectDisabled = useCallback(
		() => selectedCodes.length >= MAX_COMPARE_BUILDERS,
		[selectedCodes.length],
	);

	const toggleCompareMode = useCallback(() => {
		const next = !compareMode;
		setCompareMode(next);
		if (!next) setSelectedCodes([]);
		posthog.capture("builders_compare_mode_toggled", { enabled: next });
	}, [compareMode]);

	const compareHref = useMemo(() => {
		const codesParam = selectedCodes.map(encodeURIComponent).join(",");
		return `/builders/compare?codes=${codesParam}&timeframe=${timeframe}` as Route;
	}, [selectedCodes, timeframe]);

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
				onCheckedChange={(value) => {
					const nextShowUnnamed = Boolean(value);
					setShowUnnamed(nextShowUnnamed);
					posthog.capture("builders_unnamed_toggled", { show_unnamed: nextShowUnnamed });
				}}
			/>
			Show unnamed builders
		</label>
	);

	const compareToggle = (
		<Button
			variant={compareMode ? "secondary" : "outline"}
			size="sm"
			onClick={toggleCompareMode}
			aria-pressed={compareMode}
		>
			<GitCompareIcon className="size-4" />
			Compare
		</Button>
	);

	const mergedToolbarRight = (
		<div className="flex flex-wrap items-center gap-3">
			{unnamedToggle}
			{compareToggle}
			{toolbarRight}
		</div>
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
		<>
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
				selectable={compareMode}
				selectedCodes={selectedSet}
				onToggleSelect={toggleSelect}
				isSelectDisabled={isSelectDisabled}
			/>
			{compareMode ? (
				<div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-border/60 bg-background/95 px-3 py-2 shadow-lg backdrop-blur sm:gap-3">
					<span className="text-sm tabular-nums text-muted-foreground">
						{selectedCodes.length} / {MAX_COMPARE_BUILDERS} selected
						{selectedCodes.length >= MAX_COMPARE_BUILDERS ? " · max" : ""}
					</span>
					{selectedCodes.length > 0 ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setSelectedCodes([])}
							aria-label="Clear selection"
						>
							<XIcon className="size-4" />
							Clear
						</Button>
					) : null}
					{selectedCodes.length >= 2 ? (
						<Button
							size="sm"
							nativeButton={false}
							render={
								<Link
									href={compareHref}
									onClick={() =>
										posthog.capture("builders_compare_opened", {
											source: "leaderboard",
											count: selectedCodes.length,
										})
									}
								/>
							}
						>
							Compare ({selectedCodes.length})
						</Button>
					) : (
						<Button size="sm" disabled>
							Compare ({selectedCodes.length})
						</Button>
					)}
				</div>
			) : null}
		</>
	);
}
