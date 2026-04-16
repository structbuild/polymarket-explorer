"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { ColumnDef } from "@tanstack/react-table";
import type { Trade } from "@structbuild/sdk";
import { Facehash } from "facehash";
import { ExternalLinkIcon, HashIcon } from "lucide-react";
import { useQueryStates } from "nuqs";

import { MarketTabs } from "@/components/market/market-tabs";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { facehashColorClasses } from "@/lib/facehash";
import { formatNumber, formatPriceCents, formatTimeAgo } from "@/lib/format";
import { marketDetailSearchParamParsers } from "@/lib/market-detail-search-params";
import { maxMarketTradesPageNumber } from "@/lib/market-detail-search-params-shared";
import type { PaginatedResource } from "@/lib/struct/types";
import { hasTradeTrader, isBuyTrade, isOrderFilledTrade, getActivityLabel } from "@/lib/trade-utils";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import { cn, getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";

type TradeRow = Trade;

const columns: ColumnDef<TradeRow, unknown>[] = [
	{
		id: "age",
		header: "Age",
		size: 80,
		cell: ({ row }) => (
			<p className="text-sm text-muted-foreground">
				{row.original.confirmed_at != null ? formatTimeAgo(row.original.confirmed_at) : "—"}
			</p>
		),
	},
	{
		id: "trader",
		header: "Trader",
		size: 280,
		cell: ({ row }) => {
			const trade = row.original;
			if (!hasTradeTrader(trade)) {
				return (
					<p className="text-sm text-muted-foreground" title={getActivityLabel(trade)}>
						—
					</p>
				);
			}
			const name = getTraderDisplayName(trade.trader);
			const address = normalizeWalletAddress(trade.trader.address) ?? trade.trader.address;
			return (
				<Link
					href={`/traders/${address}` as Route}
					className="max-w-48 flex items-center gap-3 hover:underline"
				>
					{trade.trader.profile_image ? (
						<Avatar size="lg" className="size-9 rounded-md after:rounded-md">
							<AvatarImage
								src={normalizePolymarketS3ImageUrl(trade.trader.profile_image) ?? trade.trader.profile_image}
								className="rounded-md"
							/>
						</Avatar>
					) : (
						<Facehash
							className="size-9 shrink-0 overflow-hidden rounded-md border"
							colorClasses={facehashColorClasses}
							name={address}
						/>
					)}
					<span className="min-w-0 flex-1 truncate text-base font-medium" title={name}>
						{name}
					</span>
				</Link>
			);
		},
	},
	{
		id: "outcome",
		header: "Outcome",
		size: 180,
		cell: ({ row }) => {
			const trade = row.original;
			if (isOrderFilledTrade(trade)) {
				return (
					<p className="truncate">
						{trade.outcome ?? "—"} <span className="text-muted-foreground">/</span> {formatPriceCents(trade.price)}
					</p>
				);
			}
			const label = getActivityLabel(trade);
			return (
				<p className="truncate text-foreground/80" title={label}>
					{label}
				</p>
			);
		},
	},
	{
		id: "shares",
		header: "Shares",
		size: 110,
		cell: ({ row }) => {
			const trade = row.original;
			if (isOrderFilledTrade(trade)) {
				const isBuy = isBuyTrade(trade);
				return (
					<p className={cn(isBuy ? "text-emerald-500" : "text-red-500")}>
						{isBuy ? "+" : "-"}
						{formatNumber(trade.shares_amount, { decimals: 2 })}
					</p>
				);
			}
			const sharesAmount = "shares_amount" in trade ? trade.shares_amount : null;
			return <p className="text-foreground/80">{formatNumber(sharesAmount, { decimals: 2 })}</p>;
		},
	},
	{
		id: "value",
		header: "Value",
		size: 120,
		cell: ({ row }) => {
			const trade = row.original;
			if (isOrderFilledTrade(trade)) {
				return <p>{formatNumber(trade.usd_amount, { currency: true, compact: true })}</p>;
			}
			const usdAmount = "usd_amount" in trade ? trade.usd_amount : null;
			const isPositive = usdAmount != null && usdAmount > 0;
			const isNegative = usdAmount != null && usdAmount < 0;
			return (
				<p className={cn(isPositive ? "text-emerald-500" : isNegative ? "text-red-500" : "")}>
					{isPositive ? "+" : ""}
					{formatNumber(usdAmount, { currency: true, compact: true })}
				</p>
			);
		},
	},
	{
		id: "link",
		header: "",
		size: 64,
		enableHiding: false,
		cell: ({ row }) => {
			const trade = row.original;
			return (
				<div className="flex justify-end">
					<TooltipWrapper content="View on Polygonscan">
						<a href={`https://polygonscan.com/tx/${trade.hash}`} target="_blank" rel="noopener noreferrer">
							<Button variant="ghost" size="icon" aria-label="View on Polygonscan">
								<HashIcon className="size-4" />
							</Button>
						</a>
					</TooltipWrapper>
					{hasTradeTrader(trade) ? (
						<TooltipWrapper content="View trader">
							<Link
								href={`/traders/${normalizeWalletAddress(trade.trader.address) ?? trade.trader.address}` as Route}
							>
								<Button variant="ghost" size="icon" aria-label="View trader">
									<ExternalLinkIcon className="size-4" />
								</Button>
							</Link>
						</TooltipWrapper>
					) : null}
				</div>
			);
		},
	},
];

type Props = {
	page: PaginatedResource<TradeRow, number>;
	pageNumber: number;
};

export function MarketTradesTable({ page, pageNumber }: Props) {
	const [isPending, startTransition] = useTransition();
	const [, setSearchParams] = useQueryStates(marketDetailSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: false,
		startTransition,
	});

	return (
		<DataTable
			toolbarLeft={<MarketTabs />}
			columns={columns}
			data={page.data}
			storageKey="market-trades-table"
			emptyMessage="No trades to show."
			columnLayout="fixed"
			paginationMode="server"
			pageIndex={pageNumber - 1}
			pageSize={page.pageSize}
			hasNextPage={page.hasMore}
			isLoading={isPending}
			onPageIndexChange={(nextPageIndex) => {
				const nextPageNumber = Math.min(Math.max(nextPageIndex + 1, 1), maxMarketTradesPageNumber);

				if (nextPageNumber === pageNumber) {
					return;
				}

				void setSearchParams({ tradesPage: nextPageNumber });
			}}
		/>
	);
}
