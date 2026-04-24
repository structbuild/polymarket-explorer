import type { DataTableSkeletonColumn } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export const MARKET_TABLE_COLUMN_SIZES = {
	market: 600,
	probability: 112,
	volume: 112,
	trades: 96,
	traders: 96,
	fees: 96,
	liquidity: 112,
	holders: 88,
	ends: 120,
	link: 96,
} as const;

export const MARKET_SKELETON_COLUMNS: readonly DataTableSkeletonColumn[] = [
	{
		id: "market",
		size: MARKET_TABLE_COLUMN_SIZES.market,
		headerClassName: "w-16",
		cell: (
			<div className="flex min-w-0 items-center gap-3">
				<Skeleton className="size-10 shrink-0 rounded-md" />
				<div className="min-w-0 flex-1 space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-2/3" />
				</div>
			</div>
		),
	},
	{
		id: "probability",
		size: MARKET_TABLE_COLUMN_SIZES.probability,
		headerClassName: "w-20",
		cell: <Skeleton className="h-4 w-10" />,
	},
	{
		id: "volume",
		size: MARKET_TABLE_COLUMN_SIZES.volume,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "trades",
		size: MARKET_TABLE_COLUMN_SIZES.trades,
		headerClassName: "w-12",
		cell: <Skeleton className="h-4 w-10" />,
	},
	{
		id: "traders",
		size: MARKET_TABLE_COLUMN_SIZES.traders,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-10" />,
	},
	{
		id: "liquidity",
		size: MARKET_TABLE_COLUMN_SIZES.liquidity,
		headerClassName: "w-16",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "holders",
		size: MARKET_TABLE_COLUMN_SIZES.holders,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-10" />,
	},
	{
		id: "ends",
		size: MARKET_TABLE_COLUMN_SIZES.ends,
		headerClassName: "w-10",
		cell: <Skeleton className="h-4 w-14" />,
	},
	{
		id: "link",
		size: MARKET_TABLE_COLUMN_SIZES.link,
		headerClassName: "w-0",
		cell: (
			<div className="flex justify-end">
				<Skeleton className="size-9" />
			</div>
		),
	},
];
