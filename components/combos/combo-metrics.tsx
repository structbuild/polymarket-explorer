import { ComboMetricsClient } from "@/components/combos/combo-metrics-client";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getComboMetrics } from "@/lib/struct/queries/combos";

function MetricsCard({ children }: { children: React.ReactNode }) {
	return (
		<section className="bg-card rounded-lg p-4 sm:p-6">
			<p className="text-sm text-foreground sm:text-base">Metrics</p>
			<Separator className="my-3 sm:my-4" />
			{children}
		</section>
	);
}

export async function ComboMetrics({ conditionId }: { conditionId: string }) {
	const metrics = await getComboMetrics(conditionId);
	const timeframes = metrics?.timeframes ?? [];

	if (timeframes.length === 0) {
		return (
			<MetricsCard>
				<p className="text-sm text-muted-foreground">No metrics available yet.</p>
			</MetricsCard>
		);
	}

	return <ComboMetricsClient timeframes={timeframes} />;
}

export function ComboMetricsFallback() {
	return (
		<section className="bg-card rounded-lg p-4 sm:p-6">
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm text-foreground sm:text-base">Metrics</p>
				<Skeleton className="h-7 w-64 max-w-[60%]" />
			</div>
			<Separator className="my-3 sm:my-4" />
			{Array.from({ length: 2 }, (_, group) => (
				<div key={group}>
					{group > 0 ? <Separator className="my-3 sm:my-4" /> : null}
					<Skeleton className="mb-2 h-5 w-16 sm:mb-3" />
					<div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
						{Array.from({ length: 6 }, (_, i) => (
							<div key={i} className="min-w-0 space-y-0.5">
								<Skeleton className="h-4 w-16 sm:h-5" />
								<Skeleton className="h-5 w-20 sm:h-6" />
							</div>
						))}
					</div>
				</div>
			))}
		</section>
	);
}
