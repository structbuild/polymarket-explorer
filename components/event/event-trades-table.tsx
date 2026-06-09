"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Trade } from "@structbuild/sdk";
import { Facehash } from "facehash";
import { HashIcon } from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { captureOutbound } from "@/components/ui/external-link";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { TimeAgo } from "@/components/ui/time-ago";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { facehashColorClasses } from "@/lib/facehash";
import { formatNumber, formatPriceCents } from "@/lib/format";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import { getActivityLabel, hasTradeTrader, isBuyTrade, isOrderFilledTrade } from "@/lib/trade-utils";
import { cn, getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";

type TradeRow = Trade;

function getTradeMarketSlug(trade: Trade): string | null {
	const slug = "slug" in trade ? trade.slug : null;
	return slug ?? null;
}

function getTradeMarketQuestion(trade: Trade): string | null {
	const question = "question" in trade ? trade.question : null;
	return question ?? null;
}

function getTradeMarketImage(trade: Trade): string | null {
	const imageUrl = "image_url" in trade ? trade.image_url : null;
	return imageUrl ?? null;
}

const columns: ColumnDef<TradeRow, unknown>[] = [
	{
		id: "age",
		header: "Age",
		size: 80,
		cell: ({ row }) =>
			row.original.confirmed_at != null ? (
				<TimeAgo timestamp={row.original.confirmed_at} className="text-sm text-muted-foreground" />
			) : (
				<p className="text-sm text-muted-foreground">—</p>
			),
	},
	{
		id: "market",
		header: "Market",
		size: 280,
		cell: ({ row }) => {
			const trade = row.original;
			const slug = getTradeMarketSlug(trade);
			const question = getTradeMarketQuestion(trade) ?? slug ?? "—";
			const imageUrl = normalizePolymarketS3ImageUrl(getTradeMarketImage(trade)) ?? null;

			const inner = (
				<div className="flex min-w-0 items-center gap-3">
					{imageUrl ? (
						<Image
							src={imageUrl}
							alt={question}
							width={32}
							height={32}
							className="size-8 shrink-0 rounded-md object-cover"
						/>
					) : (
						<div className="size-8 shrink-0 rounded-md bg-muted" />
					)}
					<span className="line-clamp-2 min-w-0 text-sm font-medium leading-snug" title={question}>
						{question}
					</span>
				</div>
			);

			if (!slug) return inner;

			return (
				<Link
					href={`/markets/${slug}` as Route}
					prefetch={false}
					className="-mx-2 flex min-w-0 rounded px-2 py-1 transition-colors hover:bg-accent/40"
				>
					{inner}
				</Link>
			);
		},
	},
	{
		id: "trader",
		header: "Trader",
		size: 220,
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
					prefetch={false}
					className="flex max-w-48 items-center gap-3 hover:underline"
				>
					{trade.trader.profile_image ? (
						<Avatar size="lg" className="size-8 rounded-md after:rounded-md">
							<AvatarImage
								src={normalizePolymarketS3ImageUrl(trade.trader.profile_image) ?? trade.trader.profile_image}
								className="rounded-md"
							/>
						</Avatar>
					) : (
						<Facehash
							className="size-8 shrink-0 overflow-hidden rounded-md border"
							colorClasses={facehashColorClasses}
							name={address}
						/>
					)}
					<span className="min-w-0 flex-1 truncate text-sm font-medium" title={name}>
						{name}
					</span>
				</Link>
			);
		},
	},
	{
		id: "outcome",
		header: "Outcome",
		size: 160,
		cell: ({ row }) => {
			const trade = row.original;
			if (isOrderFilledTrade(trade)) {
				return (
					<p className="truncate text-sm">
						{trade.outcome ?? "—"} <span className="text-muted-foreground">/</span> {formatPriceCents(trade.price)}
					</p>
				);
			}
			const label = getActivityLabel(trade);
			return (
				<p className="truncate text-sm text-foreground/80" title={label}>
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
					<p className={cn("text-sm tabular-nums", isBuy ? "text-emerald-500" : "text-red-500")}>
						{isBuy ? "+" : "-"}
						{formatNumber(trade.shares_amount, { decimals: 2 })}
					</p>
				);
			}
			const sharesAmount = "shares_amount" in trade ? trade.shares_amount : null;
			return (
				<p className="text-sm tabular-nums text-foreground/80">
					{formatNumber(sharesAmount, { decimals: 2 })}
				</p>
			);
		},
	},
	{
		id: "value",
		header: "Value",
		size: 120,
		cell: ({ row }) => {
			const trade = row.original;
			if (isOrderFilledTrade(trade)) {
				return (
					<p className="text-sm tabular-nums">
						{formatNumber(trade.usd_amount, { currency: true, compact: true })}
					</p>
				);
			}
			const usdAmount = "usd_amount" in trade ? trade.usd_amount : null;
			const isPositive = usdAmount != null && usdAmount > 0;
			const isNegative = usdAmount != null && usdAmount < 0;
			return (
				<p className={cn("text-sm tabular-nums", isPositive ? "text-emerald-500" : isNegative ? "text-red-500" : "text-muted-foreground")}>
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
						<Button
							variant="ghost"
							size="icon"
							aria-label="View on Polygonscan"
							nativeButton={false}
							onClick={() =>
								captureOutbound(`https://polygonscan.com/tx/${trade.hash}`, {
									link_type: "polygonscan",
								})
							}
							render={
								<a
									href={`https://polygonscan.com/tx/${trade.hash}`}
									target="_blank"
									rel="noopener noreferrer"
								/>
							}
						>
							<HashIcon className="size-4" />
						</Button>
					</TooltipWrapper>
				</div>
			);
		},
	},
];

export function EventTradesTable({ trades }: { trades: TradeRow[] }) {
	return (
		<DataTable
			columns={columns}
			data={trades}
			tableName="event_trades"
			storageKey="event-trades-table"
			emptyMessage="No trades to show."
			columnLayout="fixed"
			paginationMode="none"
			toolbarLeft={
				<div className="flex items-center gap-1.5">
					<h2 className="text-lg font-medium tracking-tight">Recent trades</h2>
					<InfoTooltip content="Showing trades from the event's 10 highest-volume markets. Trades from less active markets aren't included here — open a market page to see its full trade history." />
				</div>
			}
		/>
	);
}
