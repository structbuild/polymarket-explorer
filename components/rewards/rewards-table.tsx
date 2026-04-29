"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { MarketResponse } from "@structbuild/sdk";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon, InfoIcon } from "lucide-react";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/format";
import { REWARDS_TABLE_COLUMN_SIZES } from "./rewards-table-columns";

function sumRewardField(
	market: MarketResponse,
	field:
		| "rewards_daily_rate"
		| "total_daily_rate"
		| "native_daily_rate"
		| "sponsored_daily_rate"
		| "rewards_max_spread"
		| "rewards_min_size"
		| "sponsors_count",
) {
	return market.clob_rewards?.map((r) => r[field]).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? null;
}

const columns: ColumnDef<MarketResponse, unknown>[] = [
	{
		id: "market",
		header: "Market",
		enableHiding: false,
		size: REWARDS_TABLE_COLUMN_SIZES.market,
		meta: { cellClassName: "whitespace-normal" },
		cell: ({ row }) => {
			const market = row.original;
			const href = market.market_slug ? (`/markets/${market.market_slug}` as Route) : null;
			return (
				<div className="flex items-center gap-3">
					{market.image_url ? (
						<Image
							className="size-10 shrink-0 rounded-md object-cover"
							alt={market.question ?? ""}
							src={market.image_url}
							width={40}
							height={40}
						/>
					) : (
						<div className="size-10 shrink-0 rounded-md bg-muted" />
					)}
					<div className="min-w-0 flex-1">
						{href ? (
							<Link
								href={href}
								prefetch={false}
								className="line-clamp-2 text-base font-medium break-words text-foreground underline-offset-4 hover:underline"
								title={market.question ?? ""}
							>
								{market.question}
							</Link>
						) : (
							<p className="line-clamp-2 text-base font-medium break-words" title={market.question ?? ""}>
								{market.question}
							</p>
						)}
					</div>
				</div>
			);
		},
	},
	{
		id: "probability",
		header: "Probability",
		enableHiding: false,
		size: REWARDS_TABLE_COLUMN_SIZES.probability,
		cell: ({ row }) => <p>{formatNumber((row.original.outcomes?.[0]?.price ?? 0) * 100, { percent: true })}</p>,
	},
	{
		id: "volume",
		header: "Volume (24h)",
		enableHiding: false,
		size: REWARDS_TABLE_COLUMN_SIZES.volume,
		cell: ({ row }) => {
			const val = row.original.metrics?.["24h"]?.volume ?? 0;
			if (val == null) return <p className="text-muted-foreground">—</p>;
			return <p>{formatNumber(val, { currency: true, compact: true })}</p>;
		},
	},
	{
		id: "liquidity",
		header: "Liquidity",
		enableHiding: false,
		size: REWARDS_TABLE_COLUMN_SIZES.liquidity,
		cell: ({ row }) => {
			const val = row.original.liquidity_usd;
			if (val == null) return <p className="text-muted-foreground">—</p>;
			return <p>{formatNumber(val, { currency: true, compact: true })}</p>;
		},
	},
	{
		id: "rewards",
		meta: { title: "Rewards" },
		header: () => (
			<span className="flex items-center gap-1.5">
				Rewards
				<TooltipWrapper content="Daily reward rate for liquidity provision. The total combines Polymarket-provided incentives and sponsored rewards. Hover a cell to see how this row splits between the two.">
					<InfoIcon className="size-4 text-muted-foreground" />
				</TooltipWrapper>
			</span>
		),
		enableHiding: false,
		size: REWARDS_TABLE_COLUMN_SIZES.rewards,
		cell: ({ row }) => {
			const total = sumRewardField(row.original, "total_daily_rate");
			const native = sumRewardField(row.original, "native_daily_rate");
			const sponsored = sumRewardField(row.original, "sponsored_daily_rate");
			if (total == null) return <p className="text-muted-foreground">—</p>;
			const n = native ?? 0;
			const s = sponsored ?? 0;
			const parts: string[] = [];
			if (n >= 0.1) parts.push(`${formatNumber(n, { currency: true })} via Polymarket`);
			if (s >= 0.1) parts.push(`${formatNumber(s, { currency: true })} sponsored`);
			const breakdown = parts.length > 0 ? parts.join(" + ") : null;
			const body = (
				<p className="inline-block font-medium text-emerald-500 border-b border-dotted border-muted-foreground/50">
					{formatNumber(total, { currency: true })}
				</p>
			);
			if (!breakdown) return body;
			return (
				<TooltipWrapper content={breakdown}>
					<span className="inline-block cursor-help">{body}</span>
				</TooltipWrapper>
			);
		},
	},
	{
		id: "max_spread",
		meta: { title: "Max Spread" },
		header: () => (
			<span className="flex items-center gap-1.5">
				Max Spread
				<TooltipWrapper content="Widest bid–ask spread your resting orders can have and still earn liquidity rewards. Tighter quotes than this qualify.">
					<InfoIcon className="size-4 text-muted-foreground" />
				</TooltipWrapper>
			</span>
		),
		enableHiding: false,
		size: REWARDS_TABLE_COLUMN_SIZES.maxSpread,
		cell: ({ row }) => {
			const spread = sumRewardField(row.original, "rewards_max_spread");
			if (spread == null) return <p className="text-muted-foreground">—</p>;
			return <p>{formatNumber(spread, { percent: true })}</p>;
		},
	},
	{
		id: "min_size",
		meta: { title: "Min Shares" },
		header: () => (
			<span className="flex items-center gap-1.5">
				Min Shares
				<TooltipWrapper content="Minimum order size to earn rewards, measured in outcome shares (not US dollars).">
					<InfoIcon className="size-4 text-muted-foreground" />
				</TooltipWrapper>
			</span>
		),
		enableHiding: false,
		size: REWARDS_TABLE_COLUMN_SIZES.minSize,
		cell: ({ row }) => {
			const size = sumRewardField(row.original, "rewards_min_size");
			if (size == null) return <p className="text-muted-foreground">—</p>;
			return <p>{formatNumber(size, { decimals: 0 })}</p>;
		},
	},
	{
		id: "sponsors",
		meta: { title: "Sponsors" },
		header: () => (
			<span className="flex items-center gap-1.5">
				Sponsors
				<TooltipWrapper content="Total external sponsors of reward liquidity for this market. Polymarket-provided incentives are not counted here.">
					<InfoIcon className="size-4 text-muted-foreground" />
				</TooltipWrapper>
			</span>
		),
		enableHiding: false,
		size: REWARDS_TABLE_COLUMN_SIZES.sponsors,
		cell: ({ row }) => {
			const count = sumRewardField(row.original, "sponsors_count");
			if (count == null) return <p className="text-muted-foreground">—</p>;
			return <p>{count}</p>;
		},
	},
	{
		id: "link",
		header: "",
		size: REWARDS_TABLE_COLUMN_SIZES.link,
		enableHiding: false,
		cell: ({ row }) => {
			const eventSlug = row.original.event_slug;
			if (!eventSlug) return null;
			return (
				<div className="flex justify-end">
					<TooltipWrapper content="View on Polymarket">
						<a href={`https://polymarket.com/event/${eventSlug}`} target="_blank" rel="noopener noreferrer">
							<Button variant="ghost" size="icon" aria-label="View on Polymarket">
								<ExternalLinkIcon className="size-4" />
							</Button>
						</a>
					</TooltipWrapper>
				</div>
			);
		},
	},
];

type Props = {
	markets: MarketResponse[];
};

export function RewardsTable({ markets }: Props) {
	return (
		<DataTable
			columns={columns}
			data={markets}
			storageKey="rewards-table"
			emptyMessage="No reward markets found."
			columnLayout="fixed"
			defaultPageSize={25}
		/>
	);
}
