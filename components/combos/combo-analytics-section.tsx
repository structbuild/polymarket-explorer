import { ComboAnalyticsChart } from "@/components/combos/combo-analytics-chart";
import { ComboAnalyticsKpi } from "@/components/combos/combo-analytics-kpi";
import { ChartCard } from "@/components/market/chart-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	getComboAnalyticsChanges,
	getComboAnalyticsCounts,
	getComboAnalyticsTimeseries,
} from "@/lib/struct/queries/combos";

const KPI_COUNT = 5;

export async function ComboAnalyticsSection() {
	const [counts, changes, timeseries] = await Promise.all([
		getComboAnalyticsCounts(),
		getComboAnalyticsChanges("24h"),
		getComboAnalyticsTimeseries("D", 90),
	]);

	if (!counts) {
		return null;
	}

	return (
		<section className="space-y-4">
			<div className="space-y-1">
				<h2 className="text-lg font-semibold">Combo activity</h2>
				<p className="text-sm text-muted-foreground">
					Lifetime totals and daily volume across all combo markets.
				</p>
			</div>
			<ComboAnalyticsKpi counts={counts} changes={changes} />
			<ChartCard title="Daily combo volume">
				<ComboAnalyticsChart rows={timeseries} />
			</ChartCard>
		</section>
	);
}

export function ComboAnalyticsSectionFallback() {
	return (
		<section className="space-y-4">
			<div className="space-y-1">
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
				{Array.from({ length: KPI_COUNT }).map((_, index) => (
					<Card key={index} size="sm" className="rounded-lg px-2 ring-0">
						<CardContent className="flex flex-col gap-0.5">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-7 w-24" />
							<Skeleton className="h-3 w-12" />
						</CardContent>
					</Card>
				))}
			</div>
			<div className="rounded-lg bg-card p-4 sm:p-6">
				<Skeleton className="mb-4 h-5 w-40" />
				<Skeleton className="h-[240px] w-full" />
			</div>
		</section>
	);
}
