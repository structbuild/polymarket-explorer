"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ComboMarketSortBy, SortDirection } from "@structbuild/sdk";
import Image from "next/image";
import { LayersIcon } from "lucide-react";

import { COMBO_MARKET_SORT_KEYS } from "@/lib/combo";
import { COMBO_TABLE_COLUMN_SIZES, type ComboMarketRow } from "@/lib/combo-market-table-map";
import { DataTable } from "@/components/ui/data-table";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Badge } from "@/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ComboLegsList, ComboTypeBadge } from "@/components/ui/combo";
import { formatNumber, formatDateShort } from "@/lib/format";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import { truncateMarketTitle } from "@/lib/utils";

const COLUMN_SORT_MAP: Partial<Record<string, ComboMarketSortBy>> = {
	volume: "usd_volume",
	trades: "txns",
	traders: "unique_traders",
	fees: "fees",
};

type SortState = {
	sortBy: ComboMarketSortBy;
	sortDirection: SortDirection;
	onSortChange: (sortBy: ComboMarketSortBy) => void;
};

function isSortableColumn(columnId: string): columnId is string {
	const key = COLUMN_SORT_MAP[columnId];
	return key !== undefined && COMBO_MARKET_SORT_KEYS.includes(key);
}

function ComboCell({ row }: { row: ComboMarketRow }) {
	const displayTitle = truncateMarketTitle(row.title);
	const primaryImage = normalizePolymarketS3ImageUrl(row.legs[0]?.imageUrl) ?? null;
	const secondaryImage = normalizePolymarketS3ImageUrl(row.legs[1]?.imageUrl) ?? null;
	const legLabel = `${row.legCount} ${row.legCount === 1 ? "leg" : "legs"}`;
	const summary =
		row.legsWon > 0 || row.legsLost > 0
			? `${row.legsWon}/${row.legCount} won`
			: null;

	return (
		<div className="flex min-w-0 items-center gap-3">
			<div className="flex shrink-0 items-center">
				{primaryImage ? (
					<Image
						src={primaryImage}
						alt={row.title}
						width={40}
						height={40}
						className="size-10 shrink-0 rounded-md object-cover"
					/>
				) : (
					<div className="size-10 shrink-0 rounded-md bg-muted" />
				)}
				{row.legCount > 1 ? (
					secondaryImage ? (
						<Image
							src={secondaryImage}
							alt={row.title}
							width={40}
							height={40}
							className="-ml-3 size-10 shrink-0 rounded-md object-cover ring-2 ring-card"
						/>
					) : (
						<div className="-ml-3 flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground ring-2 ring-card">
							+{row.legCount - 1}
						</div>
					)
				) : null}
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<p className="line-clamp-2 text-left text-base font-medium text-foreground" title={row.title}>
					{displayTitle}
				</p>
				<div className="flex flex-wrap items-center gap-1.5">
					<ComboTypeBadge comboType={row.comboType} />
					{row.legs.length > 0 ? (
						<Popover>
							<PopoverTrigger
								nativeButton={false}
								render={
									<Badge variant="secondary" className="cursor-pointer">
										<LayersIcon data-icon="inline-start" />
										{legLabel}
									</Badge>
								}
							/>
							<PopoverContent align="start" className="w-80">
								<PopoverHeader>
									<PopoverTitle>Combo legs</PopoverTitle>
								</PopoverHeader>
								<ComboLegsList legs={row.legs} />
							</PopoverContent>
						</Popover>
					) : (
						<span className="text-sm text-muted-foreground">{legLabel}</span>
					)}
					{summary ? (
						<span className="text-xs text-muted-foreground tabular-nums">{summary}</span>
					) : null}
				</div>
			</div>
		</div>
	);
}

function buildColumns(sort: SortState): ColumnDef<ComboMarketRow, unknown>[] {
	function headerFor(columnId: string, label: string) {
		const apiSortBy = COLUMN_SORT_MAP[columnId];
		if (!apiSortBy || !isSortableColumn(columnId)) {
			return label;
		}

		const HeaderComponent = function SortableHeaderForColumn() {
			return (
				<SortableHeader
					table="combos"
					sortBy={apiSortBy}
					currentSortBy={sort.sortBy}
					currentSortDirection={sort.sortDirection}
					onSortChange={sort.onSortChange}
				>
					{label}
				</SortableHeader>
			);
		};

		HeaderComponent.displayName = `SortableHeader(${columnId})`;
		return HeaderComponent;
	}

	return [
		{
			id: "combo",
			meta: { title: "Combo", cellClassName: "whitespace-normal align-middle" },
			header: "Combo",
			size: COMBO_TABLE_COLUMN_SIZES.combo,
			cell: ({ row }) => <ComboCell row={row.original} />,
		},
		{
			id: "volume",
			meta: { title: "Volume" },
			header: headerFor("volume", "Volume"),
			size: COMBO_TABLE_COLUMN_SIZES.volume,
			cell: ({ row }) => {
				const value = row.original.usdVolume;
				return (
					<p className="text-foreground/90 tabular-nums">
						{value !== null ? formatNumber(value, { compact: true, currency: true }) : "—"}
					</p>
				);
			},
		},
		{
			id: "trades",
			meta: { title: "Trades" },
			header: headerFor("trades", "Trades"),
			size: COMBO_TABLE_COLUMN_SIZES.trades,
			cell: ({ row }) => {
				const value = row.original.txns;
				return (
					<p className="text-foreground/90 tabular-nums">
						{value !== null ? formatNumber(value, { decimals: 0 }) : "—"}
					</p>
				);
			},
		},
		{
			id: "traders",
			meta: { title: "Traders" },
			header: headerFor("traders", "Traders"),
			size: COMBO_TABLE_COLUMN_SIZES.traders,
			cell: ({ row }) => {
				const value = row.original.uniqueTraders;
				return (
					<p className="text-foreground/90 tabular-nums">
						{value !== null ? formatNumber(value, { decimals: 0 }) : "—"}
					</p>
				);
			},
		},
		{
			id: "fees",
			meta: { title: "Fees" },
			header: headerFor("fees", "Fees"),
			size: COMBO_TABLE_COLUMN_SIZES.fees,
			cell: ({ row }) => {
				const value = row.original.fees;
				return (
					<p className="text-foreground/90 tabular-nums">
						{value !== null ? formatNumber(value, { compact: true, currency: true }) : "—"}
					</p>
				);
			},
		},
		{
			id: "created",
			meta: { title: "Created" },
			header: "Created",
			size: COMBO_TABLE_COLUMN_SIZES.created,
			cell: ({ row }) => (
				<p className="text-muted-foreground">
					{row.original.createdAt !== null ? formatDateShort(row.original.createdAt) : "—"}
				</p>
			),
		},
	];
}

export function CombosTable({
	rows,
	sortBy,
	sortDirection,
	onSortChange,
	toolbarLeft,
}: {
	rows: ComboMarketRow[];
	sortBy: ComboMarketSortBy;
	sortDirection: SortDirection;
	onSortChange: (sortBy: ComboMarketSortBy) => void;
	toolbarLeft?: React.ReactNode;
}) {
	const columns = buildColumns({ sortBy, sortDirection, onSortChange });

	return (
		<DataTable
			paginationMode="none"
			tableName="combos"
			columns={columns}
			data={rows}
			getRowHref={(row) => `/combos/${row.conditionId}`}
			storageKey="combos-table-v2"
			emptyMessage="No combos to show."
			columnLayout="fixed"
			toolbarLeft={toolbarLeft}
		/>
	);
}
