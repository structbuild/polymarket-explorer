"use client";

import type { CategoryEntry } from "@structbuild/sdk";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { type ReactNode, useMemo } from "react";
import { RefreshCwIcon } from "lucide-react";

import { getTraderCategoriesPageAction } from "@/app/actions";
import { DataTable } from "@/components/ui/data-table";
import { dateCol, durationCol, numericCol } from "@/components/ui/table-columns";
import { Volume } from "@/components/ui/volume";
import type { PaginatedResource } from "@/lib/struct/types";
import type { TraderCategorySortBy, TraderSortDirection } from "@/lib/trader-search-params-shared";
import { formatNumber, pnlColorClass, readTotalPnlUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import {
	type BreakdownSortContext,
	sortableHeader,
	useTraderBreakdownTable,
} from "./trader-breakdown-table";
import { TraderTabs } from "./trader-tabs";

const numericFormat = {
	count: { decimals: 0, compact: true } as Parameters<typeof formatNumber>[1],
	integer: { decimals: 0 } as Parameters<typeof formatNumber>[1],
	currency: { compact: true, currency: true } as Parameters<typeof formatNumber>[1],
	percent: { percent: true } as Parameters<typeof formatNumber>[1],
	factor: { decimals: 2 } as Parameters<typeof formatNumber>[1],
};

type CategoryAccessor = (row: CategoryEntry) => number | null | undefined;
type SortCtx = BreakdownSortContext<TraderCategorySortBy>;

function usdWithCountColumn(
	spec: {
		id: string;
		title: string;
		usd: CategoryAccessor;
		count: CategoryAccessor;
		sortKey?: TraderCategorySortBy;
		size: number;
	},
	ctx: SortCtx,
): ColumnDef<CategoryEntry, unknown> {
	return {
		id: spec.id,
		meta: { title: spec.title },
		header: sortableHeader<TraderCategorySortBy, CategoryEntry>(spec.title, spec.sortKey, ctx),
		size: spec.size,
		cell: ({ row }) => {
			const usd = spec.usd(row.original) ?? null;
			const count = spec.count(row.original) ?? null;
			const usdLabel = usd != null ? formatNumber(usd, numericFormat.currency) : "—";
			const countLabel = count != null ? formatNumber(count, { decimals: 0, compact: true }) : null;
			return (
				<p className="tabular-nums text-foreground/90">
					<span>{usdLabel}</span>
					{countLabel ? <span className="text-muted-foreground"> · {countLabel}</span> : null}
				</p>
			);
		},
	};
}

function buildColumns(ctx: SortCtx): ColumnDef<CategoryEntry, unknown>[] {
	const h = (title: string, sortKey?: TraderCategorySortBy) =>
		sortableHeader<TraderCategorySortBy, CategoryEntry>(title, sortKey, ctx);

	return [
		{
			id: "category",
			meta: { title: "Category" },
			header: "Category",
			size: 160,
			enableHiding: false,
			cell: ({ row }) =>
				row.original.category ? (
					<p className="truncate font-medium text-foreground" title={row.original.category}>
						{row.original.category}
					</p>
				) : (
					<p className="text-muted-foreground">—</p>
				),
		},
		{
			id: "pnl",
			meta: { title: "PnL" },
			header: h("PnL", "total_pnl_usd"),
			size: 128,
			enableHiding: false,
			cell: ({ row }) => {
				const pnl = readTotalPnlUsd(row.original);
				return (
					<p className={cn("tabular-nums font-medium", pnlColorClass(pnl))}>
						{formatNumber(pnl, numericFormat.currency)}
					</p>
				);
			},
		},
		{
			id: "volume",
			meta: { title: "Volume" },
			header: h("Volume", "total_volume_usd"),
			size: 120,
			cell: ({ row }) => (
				<Volume usd={row.original.total_volume_usd ?? null} shares={null} className="text-foreground/90 tabular-nums" />
			),
		},
		numericCol<CategoryEntry>({ id: "winRate", title: "Win Rate", accessor: (r) => r.market_win_rate_pct, size: 112, format: numericFormat.percent, header: h("Win Rate", "market_win_rate_pct") }),
		numericCol<CategoryEntry>({ id: "markets", title: "Markets", accessor: (r) => r.markets_traded, size: 96, format: numericFormat.integer, header: h("Markets", "markets_traded") }),
		{
			id: "trades",
			meta: { title: "Trades" },
			header: "Trades",
			size: 104,
			cell: ({ row }) => (
				<p className="tabular-nums text-foreground/90">
					{formatNumber((row.original.total_buys ?? 0) + (row.original.total_sells ?? 0), numericFormat.count)}
				</p>
			),
		},
		numericCol<CategoryEntry>({ id: "bestTradePnl", title: "Best Win", accessor: (r) => r.best_trade_pnl_usd, size: 128, format: numericFormat.currency, colorizePnl: true, header: h("Best Win", "best_trade_pnl_usd") }),
		numericCol<CategoryEntry>({ id: "profitFactor", title: "Profit Factor", accessor: (r) => r.profit_factor, size: 120, format: numericFormat.factor, header: h("Profit Factor", "profit_factor") }),
		dateCol<CategoryEntry>({ id: "lastTradeAt", title: "Last Trade", accessor: (r) => r.last_trade_at, size: 128, header: h("Last Trade", "last_trade_at") }),
		numericCol<CategoryEntry>({ id: "realizedPnl", title: "Realized PnL", accessor: (r) => r.realized_pnl_usd, size: 128, format: numericFormat.currency, colorizePnl: true, header: h("Realized PnL", "realized_pnl_usd") }),
		numericCol<CategoryEntry>({ id: "unrealizedPnl", title: "Unrealized PnL", accessor: (r) => r.unrealized_pnl_usd, size: 128, format: numericFormat.currency, colorizePnl: true, header: h("Unrealized PnL", "unrealized_pnl_usd") }),
		numericCol<CategoryEntry>({ id: "marketsWon", title: "Won", accessor: (r) => r.markets_won, size: 88, format: numericFormat.integer, header: h("Won", "markets_won") }),
		numericCol<CategoryEntry>({ id: "marketsLost", title: "Lost", accessor: (r) => r.markets_lost, size: 88, format: numericFormat.integer, header: h("Lost", "markets_lost") }),
		numericCol<CategoryEntry>({ id: "marketsResolved", title: "Resolved", accessor: (r) => r.markets_resolved, size: 104, format: numericFormat.integer, header: h("Resolved", "markets_resolved") }),
		numericCol<CategoryEntry>({ id: "avgWin", title: "Avg Win", accessor: (r) => r.avg_win_usd, size: 112, format: numericFormat.currency, colorizePnl: true, header: h("Avg Win", "avg_win_usd") }),
		numericCol<CategoryEntry>({ id: "avgLoss", title: "Avg Loss", accessor: (r) => r.avg_loss_usd, size: 112, format: numericFormat.currency, colorizePnl: true, header: h("Avg Loss", "avg_loss_usd") }),
		numericCol<CategoryEntry>({ id: "totalWins", title: "Total Wins", accessor: (r) => r.total_wins_usd, size: 120, format: numericFormat.currency, colorizePnl: true, header: h("Total Wins", "total_wins_usd") }),
		numericCol<CategoryEntry>({ id: "totalLosses", title: "Total Losses", accessor: (r) => r.total_losses_usd, size: 120, format: numericFormat.currency, colorizePnl: true, header: h("Total Losses", "total_losses_usd") }),
		numericCol<CategoryEntry>({ id: "worstLoss", title: "Worst Loss", accessor: (r) => r.worst_trade_pnl_usd, size: 128, format: numericFormat.currency, colorizePnl: true, header: h("Worst Loss", "worst_trade_pnl_usd") }),
		usdWithCountColumn({ id: "buys", title: "Buys", usd: (r) => r.buy_volume_usd, count: (r) => r.total_buys, sortKey: "buy_volume_usd", size: 144 }, ctx),
		usdWithCountColumn({ id: "sells", title: "Sells", usd: (r) => r.sell_volume_usd, count: (r) => r.total_sells, sortKey: "sell_volume_usd", size: 144 }, ctx),
		usdWithCountColumn({ id: "redemptions", title: "Redemptions", usd: (r) => r.redemption_volume_usd, count: (r) => r.total_redemptions, sortKey: "redemption_volume_usd", size: 160 }, ctx),
		usdWithCountColumn({ id: "merges", title: "Merges", usd: (r) => r.merge_volume_usd, count: (r) => r.total_merges, sortKey: "merge_volume_usd", size: 144 }, ctx),
		usdWithCountColumn({ id: "splits", title: "Splits", usd: (r) => r.split_volume_usd, count: (r) => r.total_splits, sortKey: "split_volume_usd", size: 144 }, ctx),
		numericCol<CategoryEntry>({ id: "fees", title: "Fees", accessor: (r) => r.total_fees, size: 112, format: numericFormat.currency, header: h("Fees", "total_fees") }),
		numericCol<CategoryEntry>({ id: "outcomesTraded", title: "Outcomes", accessor: (r) => r.outcomes_traded, size: 104, format: numericFormat.integer, header: h("Outcomes", "outcomes_traded") }),
		numericCol<CategoryEntry>({ id: "sharesBought", title: "Shares Bought", accessor: (r) => r.total_shares_bought, size: 132, format: numericFormat.count, header: h("Shares Bought", "total_shares_bought") }),
		durationCol<CategoryEntry>({ id: "avgHoldTime", title: "Avg Hold", accessor: (r) => r.avg_hold_time_seconds, size: 128, header: h("Avg Hold", "avg_hold_time_seconds") }),
		dateCol<CategoryEntry>({ id: "firstTradeAt", title: "First Trade", accessor: (r) => r.first_trade_at, size: 128, header: h("First Trade", "first_trade_at") }),
	];
}

const DEFAULT_VISIBLE_COLUMN_IDS = new Set([
	"category",
	"pnl",
	"volume",
	"winRate",
	"markets",
	"trades",
	"bestTradePnl",
	"profitFactor",
	"lastTradeAt",
]);

const PARAM_KEYS = {
	page: "categoriesPage",
	sortBy: "categoriesSortBy",
	sortDirection: "categoriesSortDirection",
} as const;

type Props = {
	address: string;
	page: PaginatedResource<CategoryEntry, number>;
	pageNumber: number;
	sortBy: TraderCategorySortBy;
	sortDirection: TraderSortDirection;
	tabs?: ReactNode;
	onRefresh?: () => Promise<void>;
};

export default function TraderCategories({ address, page, pageNumber, sortBy, sortDirection, tabs, onRefresh }: Props) {
	const {
		isPending,
		startTransition,
		currentPage,
		currentPageNumber,
		currentSortBy,
		currentSortDirection,
		handleSortChange,
		onPageIndexChange,
	} = useTraderBreakdownTable<TraderCategorySortBy, CategoryEntry>({
		address,
		page,
		pageNumber,
		sortBy,
		sortDirection,
		paramKeys: PARAM_KEYS,
		fetchPage: getTraderCategoriesPageAction,
	});

	const columns = useMemo(
		() => buildColumns({ currentSortBy, currentSortDirection, onSortChange: handleSortChange }),
		[currentSortBy, currentSortDirection, handleSortChange],
	);

	const defaultColumnVisibility = useMemo<VisibilityState>(
		() =>
			Object.fromEntries(
				columns.filter((column) => column.id).map((column) => [column.id as string, DEFAULT_VISIBLE_COLUMN_IDS.has(column.id as string)]),
			),
		[columns],
	);

	return (
		<DataTable
			toolbarLeft={tabs ?? <TraderTabs />}
			toolbarRight={
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						if (!onRefresh) return;
						startTransition(async () => {
							await onRefresh();
						});
					}}
					disabled={isPending || !onRefresh}
				>
					<RefreshCwIcon data-icon="inline-start" />
					Refresh
				</Button>
			}
			columns={columns}
			data={currentPage.data}
			storageKey="categories-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No category PnL yet."
			emptyClassName="py-24"
			columnLayout="fixed"
			paginationMode="server"
			pageIndex={currentPageNumber - 1}
			pageSize={currentPage.pageSize}
			hasNextPage={currentPage.hasMore}
			isLoading={isPending}
			onPageIndexChange={onPageIndexChange}
		/>
	);
}
