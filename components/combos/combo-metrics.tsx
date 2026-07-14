import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { getComboMetrics } from "@/lib/struct/queries/combos";
import type { ComboTimeframeMetrics } from "@structbuild/sdk";

function MetricsCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="bg-card rounded-lg p-4 sm:p-6">
			<h2 className="mb-4 text-sm font-medium text-muted-foreground">{title}</h2>
			{children}
		</section>
	);
}

function buildItems(timeframe: ComboTimeframeMetrics) {
	return [
		{ label: "Volume", value: formatNumber(timeframe.usd_volume, { compact: true, currency: true }) },
		{ label: "Buy volume", value: formatNumber(timeframe.usd_buy_volume, { compact: true, currency: true }) },
		{ label: "Sell volume", value: formatNumber(timeframe.usd_sell_volume, { compact: true, currency: true }) },
		{ label: "Fees", value: formatNumber(timeframe.fees, { currency: true, decimals: 0 }) },
		{ label: "Trades", value: formatNumber(timeframe.txns, { decimals: 0 }) },
		{ label: "Unique traders", value: formatNumber(timeframe.unique_traders, { decimals: 0 }) },
		{ label: "Makers", value: formatNumber(timeframe.unique_makers, { decimals: 0 }) },
		{ label: "Takers", value: formatNumber(timeframe.unique_takers, { decimals: 0 }) },
	];
}

export async function ComboMetrics({ conditionId }: { conditionId: string }) {
	const metrics = await getComboMetrics(conditionId);
	const timeframes = metrics?.timeframes ?? [];
	const lifetime = timeframes.find((t) => t.timeframe === "lifetime") ?? timeframes[0] ?? null;

	if (!lifetime) {
		return (
			<MetricsCard title="Metrics">
				<p className="text-sm text-muted-foreground">No metrics available yet.</p>
			</MetricsCard>
		);
	}

	const items = buildItems(lifetime);

	return (
		<MetricsCard title="Lifetime metrics">
			<dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
				{items.map((item) => (
					<div key={item.label}>
						<dt className="text-xs text-muted-foreground">{item.label}</dt>
						<dd className="mt-1 text-lg font-medium tabular-nums">{item.value}</dd>
					</div>
				))}
			</dl>
		</MetricsCard>
	);
}

export function ComboMetricsFallback() {
	return (
		<MetricsCard title="Metrics">
			<div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
				{Array.from({ length: 8 }, (_, i) => (
					<div key={i} className="space-y-2">
						<Skeleton className="h-3 w-16" />
						<Skeleton className="h-5 w-20" />
					</div>
				))}
			</div>
		</MetricsCard>
	);
}
