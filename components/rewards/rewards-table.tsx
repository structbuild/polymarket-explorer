"use client"
/* eslint-disable @next/next/no-img-element */

import type { ColumnDef } from "@tanstack/react-table"
import type { MarketMetadata } from "@structbuild/sdk"
import { ExternalLinkIcon } from "lucide-react"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { TooltipWrapper } from "@/components/ui/tooltip"
import { formatNumber } from "@/lib/utils"

const columns: ColumnDef<MarketMetadata, unknown>[] = [
	{
		id: "market",
		header: "Market",
		enableHiding: false,
		size: 420,
		meta: { cellClassName: "whitespace-normal" },
		cell: ({ row }) => {
			const market = row.original
			return (
				<div className="flex items-center gap-3">
					{market.image_url ? (
						<img className="size-10 shrink-0 rounded-md object-cover" alt="" src={market.image_url} />
					) : (
						<div className="size-10 shrink-0 rounded-md bg-muted" />
					)}
					<div className="min-w-0 flex-1">
						<p
							className="line-clamp-2 text-base font-medium wrap-break-word"
							title={market.question}
						>
							{market.question}
						</p>
					</div>
				</div>
			)
		},
	},
	{
		id: "probability",
		header: "Probability",
		enableHiding: false,
		size: 140,
		cell: ({ row }) => <p>{formatNumber((row.original.outcomes?.[0]?.price ?? 0) * 100, { percent: true })}</p>,
	},
	{
		id: "volume",
		header: "Volume (24h)",
		enableHiding: false,
		size: 130,
		cell: ({ row }) => {
			// @ts-expect-error - metrics is not typed
			const val = row.original.metrics?.["24h"]?.volume ?? 0
			if (val == null) return <p className="text-muted-foreground">—</p>
			return <p>{formatNumber(val, { currency: true, compact: true })}</p>
		},
	},
	{
		id: "liquidity",
		header: "Liquidity",
		enableHiding: false,
		size: 130,
		cell: ({ row }) => {
			const val = row.original.liquidity_usd
			if (val == null) return <p className="text-muted-foreground">—</p>
			return <p>{formatNumber(val, { currency: true, compact: true })}</p>
		},
	},
	{
		id: "daily_rewards",
		header: "Daily Rewards",
		enableHiding: false,
		size: 120,
		cell: ({ row }) => {
			const rate = row.original.clob_rewards.map((reward) => reward.rewards_daily_rate).reduce((a, b) => (a ?? 0) + (b ?? 0), 0)
			if (rate == null) return <p className="text-muted-foreground">—</p>
			return <p className="font-medium text-emerald-500">{formatNumber(rate, { currency: true })}</p>
		},
	},
	{
		id: "link",
		header: "",
		size: 64,
		enableHiding: false,
		cell: ({ row }) => {
			const slug = row.original.event_slug
			if (!slug) return null
			return (
				<div className="flex justify-end">
					<TooltipWrapper content="View on Polymarket">
						<a
							href={`https://polymarket.com/event/${slug}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button variant="ghost" size="icon" aria-label="View on Polymarket">
								<ExternalLinkIcon className="size-4" />
							</Button>
						</a>
					</TooltipWrapper>
				</div>
			)
		},
	},
]

type Props = {
	markets: MarketMetadata[]
}

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
	)
}
