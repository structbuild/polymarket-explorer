import type { DataTableSkeletonColumn } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export const REWARDS_TABLE_COLUMN_SIZES = {
	market: 420,
	probability: 140,
	volume: 130,
	liquidity: 130,
	rewards: 150,
	maxSpread: 100,
	minSize: 100,
	sponsors: 80,
	link: 64,
} as const;

export const REWARDS_SKELETON_COLUMNS: readonly DataTableSkeletonColumn[] = [
	{
		id: "market",
		size: REWARDS_TABLE_COLUMN_SIZES.market,
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
		size: REWARDS_TABLE_COLUMN_SIZES.probability,
		headerClassName: "w-20",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "volume",
		size: REWARDS_TABLE_COLUMN_SIZES.volume,
		headerClassName: "w-20",
		cell: <Skeleton className="h-4 w-14" />,
	},
	{
		id: "liquidity",
		size: REWARDS_TABLE_COLUMN_SIZES.liquidity,
		headerClassName: "w-16",
		cell: <Skeleton className="h-4 w-14" />,
	},
	{
		id: "rewards",
		size: REWARDS_TABLE_COLUMN_SIZES.rewards,
		headerClassName: "w-16",
		cell: <Skeleton className="h-4 w-16" />,
	},
	{
		id: "max_spread",
		size: REWARDS_TABLE_COLUMN_SIZES.maxSpread,
		headerClassName: "w-20",
		cell: <Skeleton className="h-4 w-10" />,
	},
	{
		id: "min_size",
		size: REWARDS_TABLE_COLUMN_SIZES.minSize,
		headerClassName: "w-20",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "sponsors",
		size: REWARDS_TABLE_COLUMN_SIZES.sponsors,
		headerClassName: "w-16",
		cell: <Skeleton className="h-4 w-8" />,
	},
	{
		id: "link",
		size: REWARDS_TABLE_COLUMN_SIZES.link,
		headerClassName: "w-0",
		cell: (
			<div className="flex justify-end">
				<Skeleton className="size-9" />
			</div>
		),
	},
];
