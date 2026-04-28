import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
	defaultBuilderTradesPageSize,
	getBuilderTradesPage,
} from "@/lib/struct/builder-queries";

import { BuilderRecentTradesTable } from "./builder-recent-trades-table";

type BuilderRecentTradesProps = {
	builderCode: string;
	pageNumber: number;
};

export async function BuilderRecentTrades({
	builderCode,
	pageNumber,
}: BuilderRecentTradesProps) {
	const page = await getBuilderTradesPage(builderCode, {
		limit: defaultBuilderTradesPageSize,
		offset: (pageNumber - 1) * defaultBuilderTradesPageSize,
	});

	return (
		<section>
			<BuilderRecentTradesTable
				builderCode={builderCode}
				page={page}
				pageNumber={pageNumber}
				toolbarLeft={
					<div className="flex items-center gap-1.5">
						<h2 className="text-lg font-medium text-foreground/90">Recent trades</h2>
						<InfoTooltip content="Newest trades routed through this builder code." />
					</div>
				}
			/>
		</section>
	);
}

export function BuilderRecentTradesFallback() {
	return (
		<section className="space-y-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="h-7 w-32 animate-pulse rounded bg-muted" />
				<div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
					<div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
					<div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
				</div>
			</div>
			<div className="overflow-hidden rounded-lg bg-card">
				<div className="space-y-2 p-4">
					{Array.from({ length: 8 }, (_, index) => (
						<div key={index} className="h-12 animate-pulse rounded bg-muted/60" />
					))}
				</div>
			</div>
		</section>
	);
}
