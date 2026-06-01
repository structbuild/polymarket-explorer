"use client";

import type { CategoryEntry } from "@structbuild/sdk";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { type ReactNode, useState, useTransition } from "react";
import { useQueryStates } from "nuqs";
import { RefreshCwIcon } from "lucide-react";

import { getTraderCategoriesPageAction } from "@/app/actions";
import { DataTable } from "@/components/ui/data-table";
import { dateCol, durationCol, numericCol } from "@/components/ui/table-columns";
import { Volume } from "@/components/ui/volume";
import type { PaginatedResource } from "@/lib/struct/types";
import { traderSearchParamParsers } from "@/lib/trader-search-params";
import { maxTraderPageNumber } from "@/lib/trader-search-params-shared";
import { formatNumber, pnlColorClass, readTotalPnlUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { TraderTabs } from "./trader-tabs";

const numericFormat = {
	count: { decimals: 0, compact: true } as Parameters<typeof formatNumber>[1],
	integer: { decimals: 0 } as Parameters<typeof formatNumber>[1],
	currency: { compact: true, currency: true } as Parameters<typeof formatNumber>[1],
	percent: { percent: true } as Parameters<typeof formatNumber>[1],
	factor: { decimals: 2 } as Parameters<typeof formatNumber>[1],
};

type CategoryAccessor = (row: CategoryEntry) => number | null | undefined;

function usdWithCountColumn(spec: {
	id: string;
	title: string;
	usd: CategoryAccessor;
	count: CategoryAccessor;
	size: number;
}): ColumnDef<CategoryEntry, unknown> {
	return {
		id: spec.id,
		meta: { title: spec.title },
		header: spec.title,
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

const columns: ColumnDef<CategoryEntry, unknown>[] = [
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
		header: "PnL",
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
		id: "openPositions",
		meta: { title: "Open Positions" },
		header: "Open Positions",
		size: 160,
		cell: ({ row }) => {
			const value = row.original.open_positions_value;
			const count = row.original.open_position_count;
			if (value == null && count == null) {
				return <p className="tabular-nums text-muted-foreground">—</p>;
			}
			const isDust = value != null && value !== 0 && Math.abs(value) < 0.01;
			const isMuted = value == null || value === 0 || isDust;
			const valueLabel =
				value == null || value === 0 ? "$0.00" : isDust ? "<$0.01" : formatNumber(value, numericFormat.currency);
			const countLabel = count != null ? formatNumber(count, { decimals: 0, compact: true }) : null;
			return (
				<p className="tabular-nums">
					<span className={isMuted ? "text-muted-foreground" : "text-foreground/90"}>{valueLabel}</span>
					{countLabel ? <span className="text-muted-foreground"> · {countLabel}</span> : null}
				</p>
			);
		},
	},
	{
		id: "volume",
		meta: { title: "Volume" },
		header: "Volume",
		size: 120,
		cell: ({ row }) => (
			<Volume usd={row.original.total_volume_usd ?? null} shares={null} className="text-foreground/90 tabular-nums" />
		),
	},
	numericCol<CategoryEntry>({ id: "winRate", title: "Win Rate", accessor: (r) => r.market_win_rate_pct, size: 112, format: numericFormat.percent }),
	numericCol<CategoryEntry>({ id: "markets", title: "Markets", accessor: (r) => r.markets_traded, size: 96, format: numericFormat.integer }),
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
	numericCol<CategoryEntry>({ id: "bestTradePnl", title: "Best Win", accessor: (r) => r.best_trade_pnl_usd, size: 128, format: numericFormat.currency, colorizePnl: true }),
	numericCol<CategoryEntry>({ id: "profitFactor", title: "Profit Factor", accessor: (r) => r.profit_factor, size: 120, format: numericFormat.factor }),
	dateCol<CategoryEntry>({ id: "lastTradeAt", title: "Last Trade", accessor: (r) => r.last_trade_at, size: 128 }),
	numericCol<CategoryEntry>({ id: "realizedPnl", title: "Realized PnL", accessor: (r) => r.realized_pnl_usd, size: 128, format: numericFormat.currency, colorizePnl: true }),
	numericCol<CategoryEntry>({ id: "unrealizedPnl", title: "Unrealized PnL", accessor: (r) => r.unrealized_pnl_usd, size: 128, format: numericFormat.currency, colorizePnl: true }),
	numericCol<CategoryEntry>({ id: "marketsWon", title: "Won", accessor: (r) => r.markets_won, size: 88, format: numericFormat.integer }),
	numericCol<CategoryEntry>({ id: "marketsLost", title: "Lost", accessor: (r) => r.markets_lost, size: 88, format: numericFormat.integer }),
	numericCol<CategoryEntry>({ id: "marketsResolved", title: "Resolved", accessor: (r) => r.markets_resolved, size: 104, format: numericFormat.integer }),
	numericCol<CategoryEntry>({ id: "avgWin", title: "Avg Win", accessor: (r) => r.avg_win_usd, size: 112, format: numericFormat.currency, colorizePnl: true }),
	numericCol<CategoryEntry>({ id: "avgLoss", title: "Avg Loss", accessor: (r) => r.avg_loss_usd, size: 112, format: numericFormat.currency, colorizePnl: true }),
	numericCol<CategoryEntry>({ id: "totalWins", title: "Total Wins", accessor: (r) => r.total_wins_usd, size: 120, format: numericFormat.currency, colorizePnl: true }),
	numericCol<CategoryEntry>({ id: "totalLosses", title: "Total Losses", accessor: (r) => r.total_losses_usd, size: 120, format: numericFormat.currency, colorizePnl: true }),
	numericCol<CategoryEntry>({ id: "worstLoss", title: "Worst Loss", accessor: (r) => r.worst_trade_pnl_usd, size: 128, format: numericFormat.currency, colorizePnl: true }),
	usdWithCountColumn({ id: "buys", title: "Buys", usd: (r) => r.buy_volume_usd, count: (r) => r.total_buys, size: 144 }),
	usdWithCountColumn({ id: "sells", title: "Sells", usd: (r) => r.sell_volume_usd, count: (r) => r.total_sells, size: 144 }),
	usdWithCountColumn({ id: "redemptions", title: "Redemptions", usd: (r) => r.redemption_volume_usd, count: (r) => r.total_redemptions, size: 160 }),
	usdWithCountColumn({ id: "merges", title: "Merges", usd: (r) => r.merge_volume_usd, count: (r) => r.total_merges, size: 144 }),
	usdWithCountColumn({ id: "splits", title: "Splits", usd: (r) => r.split_volume_usd, count: (r) => r.total_splits, size: 144 }),
	numericCol<CategoryEntry>({ id: "fees", title: "Fees", accessor: (r) => r.total_fees, size: 112, format: numericFormat.currency }),
	numericCol<CategoryEntry>({ id: "outcomesTraded", title: "Outcomes", accessor: (r) => r.outcomes_traded, size: 104, format: numericFormat.integer }),
	numericCol<CategoryEntry>({ id: "sharesBought", title: "Shares Bought", accessor: (r) => r.total_shares_bought, size: 132, format: numericFormat.count }),
	durationCol<CategoryEntry>({ id: "avgHoldTime", title: "Avg Hold", accessor: (r) => r.avg_hold_time_seconds, size: 128 }),
	dateCol<CategoryEntry>({ id: "firstTradeAt", title: "First Trade", accessor: (r) => r.first_trade_at, size: 128 }),
];

const DEFAULT_VISIBLE_COLUMN_IDS = new Set([
	"category",
	"pnl",
	"openPositions",
	"volume",
	"winRate",
	"markets",
	"trades",
	"bestTradePnl",
	"profitFactor",
	"lastTradeAt",
]);

const defaultColumnVisibility: VisibilityState = Object.fromEntries(
	columns.filter((column) => column.id).map((column) => [column.id as string, DEFAULT_VISIBLE_COLUMN_IDS.has(column.id as string)]),
);

type Props = {
	address: string;
	page: PaginatedResource<CategoryEntry, number>;
	pageNumber: number;
	tabs?: ReactNode;
	onRefresh?: () => Promise<void>;
};

export default function TraderCategories({ address, page, pageNumber, tabs, onRefresh }: Props) {
	const [isPending, startTransition] = useTransition();
	const [pageState, setPageState] = useState(() => ({
		sourcePage: page,
		sourcePageNumber: pageNumber,
		page,
		pageNumber,
	}));
	const [, setSearchParams] = useQueryStates(traderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: true,
		startTransition,
	});

	const hasLocalPage = pageState.sourcePage === page && pageState.sourcePageNumber === pageNumber;
	const currentPage = hasLocalPage ? pageState.page : page;
	const currentPageNumber = hasLocalPage ? pageState.pageNumber : pageNumber;

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
			onPageIndexChange={(nextPageIndex) => {
				const nextPageNumber = Math.min(Math.max(nextPageIndex + 1, 1), maxTraderPageNumber);

				if (nextPageNumber === currentPageNumber) {
					return;
				}

				startTransition(async () => {
					void setSearchParams({ categoriesPage: nextPageNumber });

					const result = await getTraderCategoriesPageAction({
						address,
						pageNumber: nextPageNumber,
					});

					setPageState({
						sourcePage: page,
						sourcePageNumber: pageNumber,
						page: result.page,
						pageNumber: result.pageNumber,
					});
				});
			}}
		/>
	);
}
