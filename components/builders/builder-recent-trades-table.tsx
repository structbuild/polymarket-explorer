"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { Trade } from "@structbuild/sdk";
import { Facehash } from "facehash";
import { HashIcon, RefreshCwIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useQueryStates } from "nuqs";

import { getBuilderTradesPageAction } from "@/app/actions";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { TimeAgo } from "@/components/ui/time-ago";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { builderSearchParamParsers } from "@/lib/builder-search-params";
import { maxBuilderTradesPageNumber } from "@/lib/builder-search-params-shared";
import { facehashColorClasses } from "@/lib/facehash";
import { formatNumber, formatPriceCents } from "@/lib/format";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import type { PaginatedResource } from "@/lib/struct/types";
import { hasTradeTrader, isBuyTrade, isOrderFilledTrade } from "@/lib/trade-utils";
import { cn, getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";

type TradeRow = Trade;

const defaultColumnVisibility: VisibilityState = {
	builder_fee: false,
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
		id: "trader",
		header: "Trader",
		size: 192,
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
					prefetch={false}
					className="w-full max-w-48 flex items-center gap-2 hover:underline"
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
		size: 520,
		cell: ({ row }) => {
			const trade = row.original;
			if (!isOrderFilledTrade(trade)) return <p className="text-muted-foreground">—</p>;
			const label = trade.question ?? "—";
			const rawImageUrl = "image_url" in trade ? trade.image_url : null;
			const imageUrl = rawImageUrl != null ? normalizePolymarketS3ImageUrl(rawImageUrl) : null;
			const content = (
				<div className="flex w-full min-w-0 max-w-[520px] items-center gap-2">
					{imageUrl && (
						<Avatar className="rounded-sm after:rounded-sm">
							<AvatarImage src={imageUrl} className="rounded-sm" />
						</Avatar>
					)}
					<span className="min-w-0 flex-1 truncate text-sm">{label}</span>
				</div>
			);
			if (trade.slug) {
				return (
					<Link
						href={`/markets/${trade.slug}` as Route}
						prefetch={false}
						className="flex w-full min-w-0 max-w-[520px] hover:underline"
						title={label}
					>
						{content}
					</Link>
				);
			}
			return (
				<div className="w-full min-w-0 max-w-[520px]" title={label}>
					{content}
				</div>
			);
		},
	},
	{
		id: "outcome",
		header: "Outcome",
		size: 140,
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
		size: 100,
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
		id: "builder_fee",
		header: "Builder fee",
		size: 120,
		cell: ({ row }) => {
			const trade = row.original;
			const builderFee = "builder_fee" in trade ? trade.builder_fee : null;
			return (
				<p className="tabular-nums">
					{formatNumber(builderFee, { currency: true, compact: true })}
				</p>
			);
		},
	},
	{
		id: "link",
		header: "",
		size: 48,
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
	builderCode: string;
	page: PaginatedResource<TradeRow, number>;
	pageNumber: number;
	toolbarLeft?: ReactNode;
	toolbarRight?: ReactNode;
};

export function BuilderRecentTradesTable({
	builderCode,
	page,
	pageNumber,
	toolbarLeft,
	toolbarRight,
}: Props) {
	const [isPending, startTransition] = useTransition();
	const [pageState, setPageState] = useState(() => ({
		sourcePage: page,
		sourcePageNumber: pageNumber,
		page,
		pageNumber,
	}));
	const [, setSearchParams] = useQueryStates(builderSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: true,
		startTransition,
	});

	const hasLocalPage =
		pageState.sourcePage === page &&
		pageState.sourcePageNumber === pageNumber;
	const currentPage = hasLocalPage ? pageState.page : page;
	const currentPageNumber = hasLocalPage ? pageState.pageNumber : pageNumber;

	const toolbarRightWithRefresh = (
		<>
			<Button
				variant="outline"
				size="sm"
				className="shrink-0"
				disabled={isPending}
				onClick={() => {
					startTransition(async () => {
						const result = await getBuilderTradesPageAction({
							builderCode,
							pageNumber: currentPageNumber,
						});

						setPageState({
							sourcePage: page,
							sourcePageNumber: pageNumber,
							page: result.page,
							pageNumber: result.pageNumber,
						});
					});
				}}
			>
				<RefreshCwIcon data-icon="inline-start" />
				Refresh
			</Button>
			{toolbarRight}
		</>
	);

	return (
		<DataTable
			columns={columns}
			data={currentPage.data}
			storageKey={`builder-recent-trades-${builderCode}`}
			defaultColumnVisibility={defaultColumnVisibility}
			emptyMessage="No trades to show."
			columnLayout="fixed"
			toolbarLeft={toolbarLeft}
			toolbarRight={toolbarRightWithRefresh}
			paginationMode="server"
			pageIndex={currentPageNumber - 1}
			pageSize={currentPage.pageSize}
			hasNextPage={currentPage.hasMore}
			isLoading={isPending}
			onPageIndexChange={(nextPageIndex) => {
				const nextPageNumber = Math.min(Math.max(nextPageIndex + 1, 1), maxBuilderTradesPageNumber);

				if (nextPageNumber === currentPageNumber) {
					return;
				}

				startTransition(async () => {
					void setSearchParams({ tradesPage: nextPageNumber });

					const result = await getBuilderTradesPageAction({
						builderCode,
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
