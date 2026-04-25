import type { DataTableSkeletonColumn } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export const TAGS_TABLE_COLUMN_SIZES = {
	rank: 64,
	tag: 240,
	volume: 128,
	traders: 128,
	makers: 128,
	takers: 128,
	trades: 128,
	fees: 128,
} as const;

export const TAGS_SKELETON_COLUMNS: readonly DataTableSkeletonColumn[] = [
	{
		id: "rank",
		size: TAGS_TABLE_COLUMN_SIZES.rank,
		headerClassName: "w-4",
		cell: <Skeleton className="h-4 w-6" />,
	},
	{
		id: "tag",
		size: TAGS_TABLE_COLUMN_SIZES.tag,
		headerClassName: "w-10",
		cell: <Skeleton className="h-4 w-32" />,
	},
	{
		id: "volume",
		size: TAGS_TABLE_COLUMN_SIZES.volume,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-14" />,
	},
	{
		id: "traders",
		size: TAGS_TABLE_COLUMN_SIZES.traders,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "makers",
		size: TAGS_TABLE_COLUMN_SIZES.makers,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "takers",
		size: TAGS_TABLE_COLUMN_SIZES.takers,
		headerClassName: "w-14",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "trades",
		size: TAGS_TABLE_COLUMN_SIZES.trades,
		headerClassName: "w-12",
		cell: <Skeleton className="h-4 w-12" />,
	},
	{
		id: "fees",
		size: TAGS_TABLE_COLUMN_SIZES.fees,
		headerClassName: "w-10",
		cell: <Skeleton className="h-4 w-12" />,
	},
];
