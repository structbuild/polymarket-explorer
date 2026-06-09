"use client";

import type { Tag, TagSortBy, TagSortTimeframe } from "@structbuild/sdk";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "next";
import Link from "next/link";
import posthog from "posthog-js";
import { useMemo } from "react";

import { DataTable } from "@/components/ui/data-table";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Volume } from "@/components/ui/volume";
import { formatCapitalizeWords, formatNumber } from "@/lib/format";
import {
	TAG_TIMEFRAME_LABELS,
	TAG_TIMEFRAME_OPTIONS,
} from "@/lib/struct/tag-shared";
import { cn } from "@/lib/utils";
import { TAGS_TABLE_COLUMN_SIZES } from "./tags-table-columns";

type NumericField =
	| "volume_usd"
	| "builder_usd_volume"
	| "unique_traders"
	| "unique_builder_traders"
	| "unique_makers"
	| "unique_takers"
	| "txn_count"
	| "builder_txn_count"
	| "fees_usd"
	| "builder_fees_usd";

type ColumnSpec = {
	id: string;
	title: string;
	field: NumericField;
	sortKey?: TagSortBy;
	currency: boolean;
};

const NUMERIC_COLUMNS: readonly ColumnSpec[] = [
	{ id: "volume", title: "Volume", field: "volume_usd", sortKey: "volume", currency: true },
	{
		id: "builderVolume",
		title: "Builder vol",
		field: "builder_usd_volume",
		sortKey: "builder_volume",
		currency: true,
	},
	{
		id: "traders",
		title: "Traders",
		field: "unique_traders",
		sortKey: "unique_traders",
		currency: false,
	},
	{
		id: "builderTraders",
		title: "Builder traders",
		field: "unique_builder_traders",
		sortKey: "unique_builder_traders",
		currency: false,
	},
	{
		id: "makers",
		title: "Makers",
		field: "unique_makers",
		sortKey: "unique_makers",
		currency: false,
	},
	{
		id: "takers",
		title: "Takers",
		field: "unique_takers",
		sortKey: "unique_takers",
		currency: false,
	},
	{ id: "trades", title: "Trades", field: "txn_count", sortKey: "txns", currency: false },
	{
		id: "builderTrades",
		title: "Builder trades",
		field: "builder_txn_count",
		sortKey: "builder_txns",
		currency: false,
	},
	{ id: "fees", title: "Fees", field: "fees_usd", sortKey: "fees", currency: true },
	{
		id: "builderFees",
		title: "Builder fees",
		field: "builder_fees_usd",
		sortKey: "builder_fees",
		currency: true,
	},
];

const NUMERIC_COLUMN_SIZE = TAGS_TABLE_COLUMN_SIZES.volume;

function numericColumn(
	spec: ColumnSpec,
	sort: SortState,
): ColumnDef<Tag, unknown> {
	const sortKey = spec.sortKey;
	return {
		id: spec.id,
		meta: { title: spec.title },
		header: () =>
			sortKey ? (
				<SortableHeader
					sortBy={sortKey}
					currentSortBy={sort.sortBy}
					currentSortDirection="desc"
					onSortChange={sort.onSortChange}
					table="tags"
				>
					{spec.title}
				</SortableHeader>
			) : (
				<span>{spec.title}</span>
			),
		size: NUMERIC_COLUMN_SIZE,
		cell: ({ row }) => {
			const isActive = sortKey != null && sort.sortBy === sortKey;
			const className = cn(
				"tabular-nums",
				isActive ? "text-foreground font-medium" : "text-foreground/80",
			);
			if (spec.field === "volume_usd" || spec.field === "builder_usd_volume") {
				const usd =
					spec.field === "volume_usd"
						? row.original.volume_usd ?? null
						: row.original.builder_usd_volume ?? null;
				const shares =
					spec.field === "volume_usd"
						? row.original.shares_volume ?? null
						: row.original.builder_shares_volume ?? null;
				if ((usd ?? 0) <= 0 && (shares ?? 0) <= 0) {
					return <p className={className}>—</p>;
				}
				return <Volume usd={usd} shares={shares} className={className} />;
			}
			const value = row.original[spec.field] as number | null | undefined;
			return (
				<p className={className}>
					{value != null && value > 0
						? formatNumber(value, { compact: true, currency: spec.currency })
						: "—"}
				</p>
			);
		},
	};
}

type SortState = {
	sortBy: TagSortBy;
	onSortChange: (sortBy: TagSortBy) => void;
};

function buildColumns(rankOffset: number, sort: SortState): ColumnDef<Tag, unknown>[] {
	return [
		{
			id: "rank",
			meta: { title: "#" },
			header: "#",
			size: TAGS_TABLE_COLUMN_SIZES.rank,
			enableHiding: false,
			cell: ({ row }) => (
				<p className="text-muted-foreground tabular-nums">{rankOffset + row.index + 1}</p>
			),
		},
		{
			id: "tag",
			meta: { title: "Tag" },
			header: "Tag",
			size: TAGS_TABLE_COLUMN_SIZES.tag,
			enableHiding: false,
			cell: ({ row }) => {
				const tag = row.original;
				const slug = tag.slug ?? tag.label;
				return (
					<Link
						href={`/tags/${slug}` as Route}
						prefetch={false}
						className="font-medium text-foreground underline-offset-4 hover:underline"
					>
						{formatCapitalizeWords(tag.label)}
					</Link>
				);
			},
		},
		...NUMERIC_COLUMNS.map((spec) => numericColumn(spec, sort)),
	];
}

type TagsTableProps = {
	tags: Tag[];
	sort: TagSortBy;
	timeframe: TagSortTimeframe;
	rankOffset?: number;
	toolbarLeft?: React.ReactNode;
	toolbarRight?: React.ReactNode;
	onSortChange: (sortBy: TagSortBy) => void;
	onTimeframeChange: (timeframe: TagSortTimeframe) => void;
};

export function TagsTable({
	tags,
	sort,
	timeframe,
	rankOffset = 0,
	toolbarLeft,
	toolbarRight,
	onSortChange,
	onTimeframeChange,
}: TagsTableProps) {
	const columns = useMemo(
		() => buildColumns(rankOffset, { sortBy: sort, onSortChange }),
		[rankOffset, sort, onSortChange],
	);

	const timeframeToggle = (
		<ToggleGroup
			aria-label="Metrics timeframe"
			value={[timeframe]}
			onValueChange={(next) => {
				const picked = next[0];
				if (picked && picked !== timeframe) {
					posthog.capture("tags_timeframe_changed", {
						timeframe: picked,
						previous_timeframe: timeframe,
					});
					onTimeframeChange(picked as TagSortTimeframe);
				}
			}}
			variant="outline"
			size="sm"
			className="h-8"
		>
			{TAG_TIMEFRAME_OPTIONS.map((opt) => (
				<ToggleGroupItem key={opt} value={opt} aria-label={TAG_TIMEFRAME_LABELS[opt]}>
					{TAG_TIMEFRAME_LABELS[opt]}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);

	const toolbarRightCombined = (
		<div className="flex flex-wrap items-center gap-2">
			{toolbarRight}
			{timeframeToggle}
		</div>
	);

	return (
		<DataTable
			paginationMode="none"
			columns={columns}
			data={tags}
			emptyMessage="No tags found."
			columnLayout="fixed"
			tableName="tags"
			toolbarLeft={toolbarLeft}
			toolbarRight={toolbarRightCombined}
		/>
	);
}
