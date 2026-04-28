import type { DataTableSkeletonColumn } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export const BUILDERS_TABLE_COLUMN_SIZES = {
	rank: 64,
	code: 300,
	volume: 128,
	traders: 128,
	trades: 128,
	fees: 128,
	builderFees: 144,
	newUsers: 128,
	avgRevenuePerUser: 160,
	avgVolumePerUser: 160,
	makerFee: 128,
	takerFee: 128,
} as const;

export const BUILDERS_SKELETON_COLUMNS: readonly DataTableSkeletonColumn[] = [
	{
		id: "rank",
		size: BUILDERS_TABLE_COLUMN_SIZES.rank,
		headerClassName: "w-4",
		cell: <Skeleton className="h-4 w-6" />,
	},
	{
		id: "code",
		size: BUILDERS_TABLE_COLUMN_SIZES.code,
		headerClassName: "w-20",
		cell: (
			<div className="flex items-center gap-2.5">
				<Skeleton className="size-9 shrink-0 rounded-lg sm:size-10" />
				<div className="flex min-w-0 flex-1 flex-col gap-1.5">
					<Skeleton className="h-4 w-28 max-w-full" />
					<Skeleton className="h-3 w-24 max-w-full" />
				</div>
			</div>
		),
	},
	{
		id: "volume",
		size: BUILDERS_TABLE_COLUMN_SIZES.volume,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-14" />,
	},
	{
		id: "traders",
		size: BUILDERS_TABLE_COLUMN_SIZES.traders,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "trades",
		size: BUILDERS_TABLE_COLUMN_SIZES.trades,
		headerClassName: "w-12",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "fees",
		size: BUILDERS_TABLE_COLUMN_SIZES.fees,
		headerClassName: "w-10",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "builderFees",
		size: BUILDERS_TABLE_COLUMN_SIZES.builderFees,
		headerClassName: "w-16",
		cell: <Skeleton className="h-4 w-16" />,
	},
	{
		id: "newUsers",
		size: BUILDERS_TABLE_COLUMN_SIZES.newUsers,
		headerClassName: "w-16",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "avgRevenuePerUser",
		size: BUILDERS_TABLE_COLUMN_SIZES.avgRevenuePerUser,
		headerClassName: "w-24",
		cell: <Skeleton className="h-4 w-16" />,
	},
	{
		id: "avgVolumePerUser",
		size: BUILDERS_TABLE_COLUMN_SIZES.avgVolumePerUser,
		headerClassName: "w-24",
		cell: <Skeleton className="h-4 w-16" />,
	},
	{
		id: "makerFee",
		size: BUILDERS_TABLE_COLUMN_SIZES.makerFee,
		headerClassName: "w-16",
		cell: <Skeleton className="h-4 w-10" />,
	},
	{
		id: "takerFee",
		size: BUILDERS_TABLE_COLUMN_SIZES.takerFee,
		headerClassName: "w-16",
		cell: <Skeleton className="h-4 w-10" />,
	},
];
