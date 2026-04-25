import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { TAGS_SKELETON_COLUMNS } from "@/components/tags/tags-table-columns";

export function TagIndexPageFallback() {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Skeleton className="h-5 w-28" />
			<div className="mt-6">
				<DataTableSkeleton
					columns={TAGS_SKELETON_COLUMNS}
					rowCount={50}
					toolbarLeft={
						<div className="mb-3">
							<Skeleton className="h-7 w-14" />
							<Skeleton className="mt-1 h-5 w-64" />
						</div>
					}
					toolbarRight={
						<div className="flex flex-wrap items-center gap-2">
							<Skeleton className="h-8 w-56" />
							<Skeleton className="h-8 w-36" />
						</div>
					}
				/>
			</div>
			<nav
				aria-hidden="true"
				className="mt-8 flex flex-wrap items-center justify-center gap-2"
			>
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-10 w-10" />
				<Skeleton className="h-10 w-10" />
				<Skeleton className="h-10 w-10" />
				<Skeleton className="h-10 w-10" />
				<Skeleton className="h-10 w-10" />
				<Skeleton className="h-10 w-16" />
			</nav>
		</div>
	);
}
