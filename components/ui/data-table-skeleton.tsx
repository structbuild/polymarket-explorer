import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type DataTableSkeletonColumn = {
	id: string;
	size: number;
	cell?: ReactNode;
	headerClassName?: string;
};

type DataTableSkeletonProps = {
	columns: readonly DataTableSkeletonColumn[];
	rowCount: number;
	toolbarLeft?: ReactNode;
	toolbarRight?: ReactNode;
};

export function DataTableSkeleton({
	columns,
	rowCount,
	toolbarLeft,
	toolbarRight,
}: DataTableSkeletonProps) {
	const hasToolbar = toolbarLeft !== undefined || toolbarRight !== undefined;

	return (
		<div className="space-y-3">
			{hasToolbar ? (
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:min-h-8">
					<div className="min-w-0 flex-1">{toolbarLeft}</div>
					{toolbarRight !== undefined ? (
						<div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:items-end sm:justify-end">
							{toolbarRight}
						</div>
					) : null}
				</div>
			) : null}

			<div className="overflow-hidden rounded-lg bg-card">
				<div className="relative w-full">
					<div className="w-full overflow-x-auto">
						<table className="w-max min-w-full caption-bottom table-fixed text-sm">
							<colgroup>
								{columns.map((col) => (
									<col
										key={col.id}
										style={{ width: `${col.size}px`, maxWidth: `${col.size}px` }}
									/>
								))}
							</colgroup>
							<thead className="[&_tr]:border-b">
								<tr className="border-b bg-card text-muted-foreground">
									{columns.map((col) => (
										<th
											key={col.id}
											className="h-10 px-4 py-2 text-left align-middle font-medium whitespace-nowrap text-foreground"
										>
											<Skeleton className={cn("h-4 w-16", col.headerClassName)} />
										</th>
									))}
								</tr>
							</thead>
							<tbody className="[&_tr:last-child]:border-0">
								{Array.from({ length: rowCount }, (_, rowIndex) => (
									<tr key={rowIndex} className="border-b bg-card text-foreground/90">
										{columns.map((col) => (
											<td
												key={col.id}
												className="px-4 py-2 align-middle whitespace-nowrap"
											>
												{col.cell ?? <Skeleton className="h-4 w-16" />}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
