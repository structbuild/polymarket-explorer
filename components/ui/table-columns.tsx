import type { ColumnDef } from "@tanstack/react-table";

import { formatDateShort, formatDuration, formatNumber, pnlColorClass } from "@/lib/format";
import { cn } from "@/lib/utils";

type FormatOpts = Parameters<typeof formatNumber>[1];

type BaseColumnConfig<T> = {
	id: string;
	title: string;
	accessor: (row: T) => number | null | undefined;
	size?: number;
	enableHiding?: boolean;
	header?: ColumnDef<T, unknown>["header"];
	meta?: Record<string, unknown>;
};

type NumericColumnConfig<T> = BaseColumnConfig<T> & {
	format?: FormatOpts;
	colorizePnl?: boolean;
};

export function numericCol<T>(config: NumericColumnConfig<T>): ColumnDef<T, unknown> {
	const { id, title, accessor, size = 112, format, colorizePnl = false, enableHiding, header, meta } = config;
	return {
		id,
		meta: { title, ...meta },
		header: header ?? title,
		size,
		...(enableHiding !== undefined ? { enableHiding } : {}),
		cell: ({ row }) => {
			const value = accessor(row.original);
			const colorClass = colorizePnl && value != null ? pnlColorClass(value) : null;
			return (
				<p className={cn("tabular-nums", colorClass ? cn("font-medium", colorClass) : "text-foreground/90")}>
					{formatNumber(value, format)}
				</p>
			);
		},
	};
}

export function dateCol<T>(config: BaseColumnConfig<T>): ColumnDef<T, unknown> {
	const { id, title, accessor, size = 128, enableHiding, header, meta } = config;
	return {
		id,
		meta: { title, ...meta },
		header: header ?? title,
		size,
		...(enableHiding !== undefined ? { enableHiding } : {}),
		cell: ({ row }) => (
			<p className="text-foreground/90 tabular-nums">
				{formatDateShort(accessor(row.original) ?? null)}
			</p>
		),
	};
}

export function durationCol<T>(config: BaseColumnConfig<T>): ColumnDef<T, unknown> {
	const { id, title, accessor, size = 128, enableHiding, header, meta } = config;
	return {
		id,
		meta: { title, ...meta },
		header: header ?? title,
		size,
		...(enableHiding !== undefined ? { enableHiding } : {}),
		cell: ({ row }) => {
			const seconds = accessor(row.original);
			return (
				<p className="text-foreground/90 tabular-nums">
					{seconds != null ? formatDuration(seconds) : "—"}
				</p>
			);
		},
	};
}
