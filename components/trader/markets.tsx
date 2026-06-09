"use client";

import type { MarketEntry } from "@structbuild/sdk";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useMemo } from "react";
import { RefreshCwIcon } from "lucide-react";

import { getTraderMarketsPageAction } from "@/app/actions";
import { DataTable } from "@/components/ui/data-table";
import { dateCol, numericCol } from "@/components/ui/table-columns";
import { Volume } from "@/components/ui/volume";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import type { PaginatedResource } from "@/lib/struct/types";
import type { TraderMarketSortBy, TraderSortDirection } from "@/lib/trader-search-params-shared";
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
};

type MarketAccessor = (row: MarketEntry) => number | null | undefined;
type SortCtx = BreakdownSortContext<TraderMarketSortBy>;

function usdWithCountColumn(
	spec: {
		id: string;
		title: string;
		usd: MarketAccessor;
		count: MarketAccessor;
		sortKey?: TraderMarketSortBy;
		size: number;
	},
	ctx: SortCtx,
): ColumnDef<MarketEntry, unknown> {
	return {
		id: spec.id,
		meta: { title: spec.title },
		header: sortableHeader<TraderMarketSortBy, MarketEntry>(spec.title, spec.sortKey, ctx),
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

function buildColumns(ctx: SortCtx): ColumnDef<MarketEntry, unknown>[] {
	const h = (title: string, sortKey?: TraderMarketSortBy) =>
		sortableHeader<TraderMarketSortBy, MarketEntry>(title, sortKey, ctx);

	return [
		{
			id: "market",
			meta: { title: "Market", cellClassName: "whitespace-normal align-top" },
			header: "Market",
			size: 420,
			enableHiding: false,
			cell: ({ row }) => {
				const market = row.original;
				const imageUrl = market.image_url != null ? normalizePolymarketS3ImageUrl(market.image_url) : null;
				const title = market.question ?? market.title ?? market.market_slug ?? "Unknown Market";
				const href = market.market_slug ? (`/markets/${market.market_slug}` as Route) : null;
				return (
					<div className="flex max-w-[420px] items-center gap-3">
						{imageUrl ? (
							<Image
								className="size-10 shrink-0 rounded-md object-cover"
								alt={title}
								src={imageUrl}
								width={40}
								height={40}
							/>
						) : (
							<div className="size-10 shrink-0 rounded-md bg-muted" />
						)}
						{href ? (
							<Link
								href={href}
								prefetch={false}
								className="min-w-0 flex-1 truncate text-base font-medium text-foreground underline-offset-4 hover:underline"
								title={title}
							>
								{title}
							</Link>
						) : (
							<p className="min-w-0 flex-1 truncate text-base font-medium" title={title}>
								{title}
							</p>
						)}
					</div>
				);
			},
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
			id: "status",
			meta: { title: "Status" },
			header: "Status",
			size: 104,
			cell: ({ row }) => {
				const { resolved, won } = row.original;
				if (!resolved) {
					return <p className="text-muted-foreground">Open</p>;
				}
				if (won === true) {
					return <p className="font-medium text-emerald-500">Won</p>;
				}
				if (won === false) {
					return <p className="font-medium text-red-500">Lost</p>;
				}
				return <p className="text-foreground/80">Resolved</p>;
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
		numericCol<MarketEntry>({ id: "realizedPnl", title: "Realized PnL", accessor: (r) => r.realized_pnl_usd, size: 128, format: numericFormat.currency, colorizePnl: true, header: h("Realized PnL", "realized_pnl_usd") }),
		numericCol<MarketEntry>({ id: "fees", title: "Fees", accessor: (r) => r.total_fees, size: 112, format: numericFormat.currency, header: h("Fees", "total_fees") }),
		dateCol<MarketEntry>({ id: "lastTradeAt", title: "Last Trade", accessor: (r) => r.last_trade_at, size: 128, header: h("Last Trade", "last_trade_at") }),
		numericCol<MarketEntry>({ id: "unrealizedPnl", title: "Unrealized PnL", accessor: (r) => r.unrealized_pnl_usd, size: 128, format: numericFormat.currency, colorizePnl: true, header: h("Unrealized PnL", "unrealized_pnl_usd") }),
		usdWithCountColumn({ id: "buys", title: "Buys", usd: (r) => r.buy_volume_usd, count: (r) => r.total_buys, sortKey: "buy_volume_usd", size: 144 }, ctx),
		usdWithCountColumn({ id: "sells", title: "Sells", usd: (r) => r.sell_volume_usd, count: (r) => r.total_sells, sortKey: "sell_volume_usd", size: 144 }, ctx),
		usdWithCountColumn({ id: "redemptions", title: "Redemptions", usd: (r) => r.redemption_volume_usd, count: (r) => r.redeem_count, sortKey: "redemption_volume_usd", size: 160 }, ctx),
		usdWithCountColumn({ id: "merges", title: "Merges", usd: (r) => r.merge_volume_usd, count: (r) => r.merge_count, sortKey: "merge_volume_usd", size: 144 }, ctx),
		usdWithCountColumn({ id: "splits", title: "Splits", usd: (r) => r.split_volume_usd, count: (r) => r.total_splits, sortKey: "split_volume_usd", size: 144 }, ctx),
		numericCol<MarketEntry>({ id: "sharesBought", title: "Shares Bought", accessor: (r) => r.total_shares_bought, size: 132, format: numericFormat.count, header: h("Shares Bought", "total_shares_bought") }),
		numericCol<MarketEntry>({ id: "sharesSold", title: "Shares Sold", accessor: (r) => r.total_shares_sold, size: 128, format: numericFormat.count, header: h("Shares Sold", "total_shares_sold") }),
		numericCol<MarketEntry>({ id: "outcomesTraded", title: "Outcomes", accessor: (r) => r.outcomes_traded, size: 104, format: numericFormat.integer, header: h("Outcomes", "outcomes_traded") }),
		dateCol<MarketEntry>({ id: "firstTradeAt", title: "First Trade", accessor: (r) => r.first_trade_at, size: 128, header: h("First Trade", "first_trade_at") }),
	];
}

const DEFAULT_VISIBLE_COLUMN_IDS = new Set([
	"market",
	"pnl",
	"status",
	"volume",
	"trades",
	"realizedPnl",
	"fees",
	"lastTradeAt",
]);

const PARAM_KEYS = {
	page: "marketsPage",
	sortBy: "marketsSortBy",
	sortDirection: "marketsSortDirection",
} as const;

type Props = {
	address: string;
	page: PaginatedResource<MarketEntry, number>;
	pageNumber: number;
	sortBy: TraderMarketSortBy;
	sortDirection: TraderSortDirection;
	tabs?: ReactNode;
	onRefresh?: () => Promise<void>;
};

export default function TraderMarkets({ address, page, pageNumber, sortBy, sortDirection, tabs, onRefresh }: Props) {
	const {
		isPending,
		startTransition,
		currentPage,
		currentPageNumber,
		currentSortBy,
		currentSortDirection,
		handleSortChange,
		onPageIndexChange,
	} = useTraderBreakdownTable<TraderMarketSortBy, MarketEntry>({
		address,
		page,
		pageNumber,
		sortBy,
		sortDirection,
		paramKeys: PARAM_KEYS,
		fetchPage: getTraderMarketsPageAction,
	});

	const columns = useMemo(
		() => buildColumns({ currentSortBy, currentSortDirection, onSortChange: handleSortChange, table: "trader_markets" }),
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
			tableName="trader_markets"
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
			storageKey="markets-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No market PnL yet."
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
