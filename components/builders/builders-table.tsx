"use client";

import type { BuilderLatestRowWithMetadata, BuilderSortBy, BuilderTimeframe } from "@structbuild/sdk";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";

import { BuilderAvatar } from "@/components/builders/builder-avatar";
import { DataTable } from "@/components/ui/data-table";
import { SortableHeader } from "@/components/ui/sortable-header";
import { getBuilderDisplayName } from "@/lib/builder-display-name";
import { formatNumber } from "@/lib/format";
import {
	BUILDER_SORT_DESCRIPTIONS,
	isBuilderSortAvailableForTimeframe,
} from "@/lib/struct/builder-shared";
import { cn, formatBuilderCodeDisplay } from "@/lib/utils";
import { BUILDERS_TABLE_COLUMN_SIZES } from "./builders-table-columns";

type NumericField =
	| "volume_usd"
	| "unique_traders"
	| "txn_count"
	| "fees_usd"
	| "builder_fees"
	| "new_users"
	| "avg_rev_per_user"
	| "avg_vol_per_user"
	| "builder_maker_fee_rate_bps"
	| "builder_taker_fee_rate_bps";

type ColumnSpec = {
	id: string;
	title: string;
	field: NumericField;
	sortKey: BuilderSortBy;
	format: "currency" | "count" | "bps";
	size: number;
};

const NUMERIC_COLUMNS: readonly ColumnSpec[] = [
	{
		id: "volume",
		title: "Volume",
		field: "volume_usd",
		sortKey: "volume",
		format: "currency",
		size: BUILDERS_TABLE_COLUMN_SIZES.volume,
	},
	{
		id: "traders",
		title: "Traders",
		field: "unique_traders",
		sortKey: "traders",
		format: "count",
		size: BUILDERS_TABLE_COLUMN_SIZES.traders,
	},
	{
		id: "trades",
		title: "Trades",
		field: "txn_count",
		sortKey: "txns",
		format: "count",
		size: BUILDERS_TABLE_COLUMN_SIZES.trades,
	},
	{
		id: "fees",
		title: "Fees",
		field: "fees_usd",
		sortKey: "fees",
		format: "currency",
		size: BUILDERS_TABLE_COLUMN_SIZES.fees,
	},
	{
		id: "builderFees",
		title: "Builder fees",
		field: "builder_fees",
		sortKey: "builder_fees",
		format: "currency",
		size: BUILDERS_TABLE_COLUMN_SIZES.builderFees,
	},
	{
		id: "newUsers",
		title: "New users",
		field: "new_users",
		sortKey: "new_users",
		format: "count",
		size: BUILDERS_TABLE_COLUMN_SIZES.newUsers,
	},
	{
		id: "avgRevenuePerUser",
		title: "ARPU",
		field: "avg_rev_per_user",
		sortKey: "avg_rev_per_user",
		format: "currency",
		size: BUILDERS_TABLE_COLUMN_SIZES.avgRevenuePerUser,
	},
	{
		id: "avgVolumePerUser",
		title: "AVPU",
		field: "avg_vol_per_user",
		sortKey: "avg_vol_per_user",
		format: "currency",
		size: BUILDERS_TABLE_COLUMN_SIZES.avgVolumePerUser,
	},
	{
		id: "makerFee",
		title: "Maker fee",
		field: "builder_maker_fee_rate_bps",
		sortKey: "builder_maker_fee_rate_bps",
		format: "bps",
		size: BUILDERS_TABLE_COLUMN_SIZES.makerFee,
	},
	{
		id: "takerFee",
		title: "Taker fee",
		field: "builder_taker_fee_rate_bps",
		sortKey: "builder_taker_fee_rate_bps",
		format: "bps",
		size: BUILDERS_TABLE_COLUMN_SIZES.takerFee,
	},
];

type SortState = {
	sortBy: BuilderSortBy;
	onSortChange: (sortBy: BuilderSortBy) => void;
};

function formatNumericCell(value: number | null | undefined, format: ColumnSpec["format"]) {
	const numericValue = value ?? 0;
	if (numericValue < 0) return "—";

	if (format === "bps") return `${(numericValue / 100).toFixed(2)}%`;

	return formatNumber(numericValue, {
		compact: true,
		currency: format === "currency",
	});
}

function numericColumn(spec: ColumnSpec, sort: SortState): ColumnDef<BuilderLatestRowWithMetadata, unknown> {
	return {
		id: spec.id,
		meta: { title: spec.title },
		header: () => (
			<SortableHeader
				sortBy={spec.sortKey}
				currentSortBy={sort.sortBy}
				currentSortDirection="desc"
				onSortChange={sort.onSortChange}
				tooltip={BUILDER_SORT_DESCRIPTIONS[spec.sortKey]}
			>
				{spec.title}
			</SortableHeader>
		),
		size: spec.size,
		cell: ({ row }) => {
			const value = row.original[spec.field] as number | null | undefined;
			const isActive = sort.sortBy === spec.sortKey;
			const display = formatNumericCell(value, spec.format);
			return (
				<p
					className={cn(
						"tabular-nums",
						isActive ? "text-foreground font-medium" : "text-foreground/80",
					)}
				>
					{display}
				</p>
			);
		},
	};
}

function buildColumns(
	rankOffset: number,
	sort: SortState,
	timeframe: BuilderTimeframe,
): ColumnDef<BuilderLatestRowWithMetadata, unknown>[] {
	const numericColumns = NUMERIC_COLUMNS.filter((spec) =>
		isBuilderSortAvailableForTimeframe(spec.sortKey, timeframe),
	);

	return [
		{
			id: "rank",
			meta: { title: "#" },
			header: "#",
			size: BUILDERS_TABLE_COLUMN_SIZES.rank,
			enableHiding: false,
			cell: ({ row }) => (
				<p className="text-muted-foreground tabular-nums">{rankOffset + row.index + 1}</p>
			),
		},
		{
			id: "code",
			meta: { title: "Builder" },
			header: "Builder",
			size: BUILDERS_TABLE_COLUMN_SIZES.code,
			enableHiding: false,
			cell: ({ row }) => {
				const code = row.original.builder_code;
				const meta = row.original.metadata ?? null;
				const displayName = getBuilderDisplayName(code, meta);
				const codeLabel = formatBuilderCodeDisplay(code);
				const hasCustomName = Boolean(meta?.name?.trim());
				return (
					<div className="flex min-w-0 items-center gap-2.5">
						<BuilderAvatar
							builderCode={code}
							iconUrl={meta?.icon_url}
							alt={displayName}
							className="size-9! sm:size-10!"
							useFacehash={false}
						/>
						<div className="min-w-0 flex-1">
							<Link
								href={`/builders/${encodeURIComponent(code)}` as Route}
								prefetch={false}
								title={code}
								className="block truncate font-medium text-foreground underline-offset-4 hover:underline"
							>
								{displayName}
							</Link>
							{hasCustomName ? (
								<p className="truncate font-mono text-xs tabular-nums text-muted-foreground">
									{codeLabel}
								</p>
							) : null}
						</div>
					</div>
				);
			},
		},
		...numericColumns.map((spec) => numericColumn(spec, sort)),
	];
}

type BuildersTableProps = {
	builders: BuilderLatestRowWithMetadata[];
	sort: BuilderSortBy;
	timeframe: BuilderTimeframe;
	rankOffset?: number;
	pageIndex?: number;
	pageSize?: number;
	hasNextPage?: boolean;
	toolbarLeft?: React.ReactNode;
	toolbarRight?: React.ReactNode;
	onSortChange: (sortBy: BuilderSortBy) => void;
	onPageIndexChange?: (pageIndex: number) => void;
};

export function BuildersTable({
	builders,
	sort,
	timeframe,
	rankOffset = 0,
	pageIndex = 0,
	pageSize = 50,
	hasNextPage = false,
	toolbarLeft,
	toolbarRight,
	onSortChange,
	onPageIndexChange,
}: BuildersTableProps) {
	const columns = useMemo(
		() => buildColumns(rankOffset, { sortBy: sort, onSortChange }, timeframe),
		[rankOffset, sort, onSortChange, timeframe],
	);

	return (
		<DataTable
			paginationMode="server"
			pageIndex={pageIndex}
			pageSize={pageSize}
			hasNextPage={hasNextPage}
			onPageIndexChange={onPageIndexChange ?? (() => {})}
			storageKey="builders-leaderboard"
			columns={columns}
			data={builders}
			emptyMessage="No builders found."
			columnLayout="fixed"
			toolbarLeft={toolbarLeft}
			toolbarRight={toolbarRight}
		/>
	);
}
