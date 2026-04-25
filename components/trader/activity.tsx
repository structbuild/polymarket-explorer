"use client";

import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";

import { refreshTraderTabAction } from "@/app/actions";
import type { PaginatedResource } from "@/lib/struct/types";
import { traderSearchParamParsers } from "@/lib/trader-search-params";
import { maxTraderPageNumber } from "@/lib/trader-search-params-shared";
import { ExternalLinkIcon, HashIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "../ui/button";
import { DataTable } from "../ui/data-table";
import { TooltipWrapper } from "../ui/tooltip";
import { ShowUnknownMarketsToggle } from "../ui/show-unknown-markets-toggle";
import { TraderTabs } from "./trader-tabs";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatPriceCents } from "@/lib/format";
import { TimeAgo } from "@/components/ui/time-ago";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import { isOrderFilledTrade, isBuyTrade, getActivityLabel } from "@/lib/trade-utils";
import type { TradeRow } from "./types";

const defaultColumnVisibility: VisibilityState = {
	fee: false,
};

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
		size: 480,
		cell: ({ row }) => {
			const trade = row.original;
			const rawImageUrl = "image_url" in trade ? trade.image_url : null;
			const imageUrl = rawImageUrl != null ? normalizePolymarketS3ImageUrl(rawImageUrl) : null;
			const question = "question" in trade ? trade.question : null;
			const marketSlug = "slug" in trade ? trade.slug : null;
			const title = question ?? "Unknown Market";
			const href = marketSlug ? (`/markets/${marketSlug}` as Route) : null;
			return (
				<div className="flex items-center gap-3">
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
		id: "outcome",
		header: "Outcome",
		size: 180,
		cell: ({ row }) => {
			const trade = row.original;
			if (isOrderFilledTrade(trade)) {
				const label = `${trade.outcome ?? "—"} / ${formatPriceCents(trade.price)}`;
				return (
					<p className="truncate" title={label}>
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
		id: "fee",
		header: "Fee",
		size: 110,
		cell: ({ row }) => {
			const trade = row.original;
			const fee = "fee" in trade ? trade.fee : null;
			return <p>{formatNumber(fee, { currency: true })}</p>;
		},
	},
	{
		id: "link",
		header: "",
		size: 64,
		enableHiding: false,
		cell: ({ row }) => {
			const trade = row.original;
			const slug = "event_slug" in trade ? trade.event_slug : null;
			return (
				<div className="flex justify-end">
					<TooltipWrapper content="View on Polygonscan">
						<a href={`https://polygonscan.com/tx/${trade.hash}`} target="_blank" rel="noopener noreferrer">
							<Button variant="ghost" size="icon" aria-label="View on Polygonscan">
								<HashIcon className="size-4" />
							</Button>
						</a>
					</TooltipWrapper>
					{slug ? (
						<TooltipWrapper content="View on Polymarket">
							<a href={`https://polymarket.com/${slug}`} target="_blank" rel="noopener noreferrer">
								<Button variant="ghost" size="icon" aria-label="View on Polymarket">
									<ExternalLinkIcon className="size-4" />
								</Button>
							</a>
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

export default function TraderActivity({ page, pageNumber }: Props) {
	const pathname = usePathname();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [, setSearchParams] = useQueryStates(traderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: false,
		startTransition,
	});

	const [showUnknown, setShowUnknown] = useState(false);

	const hasUnknownMarkets = page.data.some((trade) => !trade.question);

	const data = useMemo(() => {
		if (showUnknown) {
			return page.data;
		}
		return page.data.filter((trade) => trade.question);
	}, [page.data, showUnknown]);

	return (
		<DataTable
			toolbarLeft={<TraderTabs />}
			toolbarRight={
				<div className="flex items-center gap-3">
					{hasUnknownMarkets ? (
						<ShowUnknownMarketsToggle show={showUnknown} onToggle={setShowUnknown} />
					) : null}
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							startTransition(async () => {
								await refreshTraderTabAction(pathname, "activity");
								router.refresh();
							});
						}}
						disabled={isPending}
					>
						<RefreshCwIcon data-icon="inline-start" />
						Refresh
					</Button>
				</div>
			}
			columns={columns}
			data={data}
			storageKey="activity-table"
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No trades to show."
			emptyClassName="py-24"
			columnLayout="fixed"
			paginationMode="server"
			pageIndex={pageNumber - 1}
			pageSize={page.pageSize}
			hasNextPage={page.hasMore}
			isLoading={isPending}
			onPageIndexChange={(nextPageIndex) => {
				const nextPageNumber = Math.min(Math.max(nextPageIndex + 1, 1), maxTraderPageNumber);

				if (nextPageNumber === pageNumber) {
					return;
				}

				void setSearchParams({ activityPage: nextPageNumber });
			}}
		/>
	);
}
