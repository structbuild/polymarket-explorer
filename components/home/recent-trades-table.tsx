"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Trade } from "@structbuild/sdk";
import { Facehash } from "facehash";
import { HashIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { facehashColorClasses } from "@/lib/facehash";
import { formatNumber, formatPriceCents } from "@/lib/format";
import { TimeAgo } from "@/components/ui/time-ago";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import { hasTradeTrader, isBuyTrade, isOrderFilledTrade } from "@/lib/trade-utils";
import { cn, getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";
import Image from "next/image";

const columns: ColumnDef<Trade, unknown>[] = [
	{
		id: "age",
		header: "Age",
		size: 60,
		cell: ({ row }) =>
			row.original.confirmed_at != null ? (
				<TimeAgo timestamp={row.original.confirmed_at} className="text-sm text-muted-foreground" />
			) : (
				<p className="text-sm text-muted-foreground">—</p>
			),
	},
	{
		id: "trader",
		header: "Trader",
		size: 180,
		cell: ({ row }) => {
			const trade = row.original;
			if (!hasTradeTrader(trade)) {
				return <p className="text-sm text-muted-foreground">—</p>;
			}
			const name = getTraderDisplayName(trade.trader);
			const address = normalizeWalletAddress(trade.trader.address) ?? trade.trader.address;
			return (
				<Link
					href={`/traders/${address}` as Route}
					className="flex max-w-44 items-center gap-2 hover:underline"
				>
					{trade.trader.profile_image ? (
						<Avatar className="rounded-sm after:rounded-sm">
							<AvatarImage
								src={normalizePolymarketS3ImageUrl(trade.trader.profile_image) ?? trade.trader.profile_image}
								className="rounded-sm"
							/>
						</Avatar>
					) : (
						<Facehash
							className="size-8! shrink-0 overflow-hidden rounded-sm! border"
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
		id: "market",
		header: "Market",
		size: 200,
		cell: ({ row }) => {
			const trade = row.original;
			if (!isOrderFilledTrade(trade)) return <p className="text-muted-foreground">—</p>;
			const label = trade.question ?? "—";
			const rawImageUrl = "image_url" in trade ? trade.image_url : null;
			const imageUrl = rawImageUrl != null ? normalizePolymarketS3ImageUrl(rawImageUrl) : null;
			const content = (
				<div className="flex items-center gap-2">
					{imageUrl && (
						<Image className="size-8 shrink-0 rounded-sm object-cover" alt={`${label} image`} src={imageUrl} width={32} height={32} />
					)}
					<span className="min-w-0 flex-1 truncate text-sm">{label}</span>
				</div>
			);
			if (trade.slug) {
				return (
					<Link
						href={`/markets/${trade.slug}` as Route}
						className="hover:underline"
						title={label}
					>
						{content}
					</Link>
				);
			}
			return <div title={label}>{content}</div>;
		},
	},
	{
		id: "outcome",
		header: "Outcome",
		size: 120,
		cell: ({ row }) => {
			const trade = row.original;
			if (!isOrderFilledTrade(trade)) return null;
			return (
				<p className="truncate">
					{trade.outcome ?? "—"} <span className="text-muted-foreground">/</span> {formatPriceCents(trade.price)}
				</p>
			);
		},
	},
	{
		id: "value",
		header: "Value",
		size: 90,
		cell: ({ row }) => {
			const trade = row.original;
			if (!isOrderFilledTrade(trade)) return null;
			const isBuy = isBuyTrade(trade);
			return (
				<p className={cn("tabular-nums", isBuy ? "text-emerald-500" : "text-red-500")}>
					{formatNumber(trade.usd_amount, { currency: true, compact: true })}
				</p>
			);
		},
	},
	{
		id: "link",
		header: "",
		size: 40,
		enableHiding: false,
		cell: ({ row }) => (
			<TooltipWrapper content="View on Polygonscan">
				<a href={`https://polygonscan.com/tx/${row.original.hash}`} target="_blank" rel="noopener noreferrer">
					<Button variant="ghost" size="icon-xs" aria-label="View on Polygonscan">
						<HashIcon className="size-3.5" />
					</Button>
				</a>
			</TooltipWrapper>
		),
	},
];

type Props = {
	trades: Trade[];
	toolbarLeft?: React.ReactNode;
	toolbarRight?: React.ReactNode;
};

export function RecentTradesTable({ trades, toolbarLeft, toolbarRight }: Props) {
	return (
		<DataTable
			columns={columns}
			data={trades}
			storageKey="home-recent-trades"
			emptyMessage="No trades to show."
			columnLayout="fixed"
			paginationMode="none"
			toolbarLeft={toolbarLeft}
			toolbarRight={toolbarRight}
		/>
	);
}
