import type { DataTableSkeletonColumn } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export const TRADER_TABLE_COLUMN_SIZES = {
	rank: 64,
	trader: 176,
	pnl: 128,
	volume: 120,
	markets: 96,
	winRate: 112,
	trades: 104,
	bestTradePnl: 128,
	avgHoldTime: 128,
	lastTradeAt: 128,
} as const;

export const TRADER_SKELETON_COLUMNS: readonly DataTableSkeletonColumn[] = [
	{
		id: "rank",
		size: TRADER_TABLE_COLUMN_SIZES.rank,
		headerClassName: "w-4",
		cell: <Skeleton className="h-4 w-6" />,
	},
	{
		id: "trader",
		size: TRADER_TABLE_COLUMN_SIZES.trader,
		headerClassName: "w-14",
		cell: (
			<div className="flex w-full min-w-0 items-center gap-3">
				<Skeleton className="size-10 shrink-0 rounded-sm" />
				<div className="min-w-0 flex-1 space-y-1.5">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-20" />
				</div>
			</div>
		),
	},
	{
		id: "pnl",
		size: TRADER_TABLE_COLUMN_SIZES.pnl,
		headerClassName: "w-20",
		cell: <Skeleton className="h-4 w-14" />,
	},
	{
		id: "volume",
		size: TRADER_TABLE_COLUMN_SIZES.volume,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-14" />,
	},
	{
		id: "markets",
		size: TRADER_TABLE_COLUMN_SIZES.markets,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-10" />,
	},
	{
		id: "winRate",
		size: TRADER_TABLE_COLUMN_SIZES.winRate,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-10" />,
	},
	{
		id: "trades",
		size: TRADER_TABLE_COLUMN_SIZES.trades,
		headerClassName: "w-12",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "bestTradePnl",
		size: TRADER_TABLE_COLUMN_SIZES.bestTradePnl,
		headerClassName: "w-16",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "avgHoldTime",
		size: TRADER_TABLE_COLUMN_SIZES.avgHoldTime,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-16" />,
	},
	{
		id: "lastTradeAt",
		size: TRADER_TABLE_COLUMN_SIZES.lastTradeAt,
		headerClassName: "w-16",
		cell: <Skeleton className="h-4 w-20" />,
	},
];
