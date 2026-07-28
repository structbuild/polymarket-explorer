"use client";

import { Fragment, useMemo, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatNumber } from "@/lib/format";
import type { ComboTimeframeMetrics } from "@structbuild/sdk";

const TIMEFRAME_ORDER = ["1m", "5m", "30m", "1h", "6h", "24h", "7d", "30d", "lifetime"] as const;

const TIMEFRAME_LABELS: Record<string, string> = {
	"1m": "1M",
	"5m": "5M",
	"30m": "30M",
	"1h": "1H",
	"6h": "6H",
	"24h": "24H",
	"7d": "7D",
	"30d": "30D",
	lifetime: "All",
};

function timeframeLabel(timeframe: string) {
	return TIMEFRAME_LABELS[timeframe] ?? timeframe.toUpperCase();
}

type MetricItem = {
	label: string;
	value: (m: ComboTimeframeMetrics) => number;
	currency?: boolean;
};

type MetricGroup = {
	key: string;
	title: string;
	items: MetricItem[];
	hideWhenEmpty?: boolean;
};

const GROUPS: MetricGroup[] = [
	{
		key: "volume",
		title: "Volume",
		items: [
			{ label: "Volume", value: (m) => m.usd_volume, currency: true },
			{ label: "Buy volume", value: (m) => m.usd_buy_volume, currency: true },
			{ label: "Sell volume", value: (m) => m.usd_sell_volume, currency: true },
			{ label: "Avg trade", value: (m) => m.avg_trade_usd ?? 0, currency: true },
			{ label: "Fees", value: (m) => m.fees, currency: true },
			{ label: "Shares volume", value: (m) => m.shares_volume },
		],
	},
	{
		key: "activity",
		title: "Activity",
		items: [
			{ label: "Trades", value: (m) => m.txns },
			{ label: "Buys", value: (m) => m.buys },
			{ label: "Sells", value: (m) => m.sells },
			{ label: "Unique traders", value: (m) => m.unique_traders },
			{ label: "Makers", value: (m) => m.unique_makers },
			{ label: "Takers", value: (m) => m.unique_takers },
		],
	},
	{
		key: "builder",
		title: "Builder",
		hideWhenEmpty: true,
		items: [
			{ label: "Volume", value: (m) => m.builder_usd_volume, currency: true },
			{ label: "Buy volume", value: (m) => m.builder_usd_buy_volume, currency: true },
			{ label: "Sell volume", value: (m) => m.builder_usd_sell_volume, currency: true },
			{ label: "Fees", value: (m) => m.builder_fees, currency: true },
			{ label: "Trades", value: (m) => m.builder_txns },
			{ label: "Traders", value: (m) => m.unique_builder_traders },
		],
	},
	{
		key: "settlement",
		title: "Settlement",
		hideWhenEmpty: true,
		items: [
			{ label: "Executions", value: (m) => m.execution_count },
			{ label: "Status updates", value: (m) => m.status_update_count },
			{ label: "Redemptions", value: (m) => m.redeemed_count },
			{ label: "Redeemed payout", value: (m) => m.redeemed_payout, currency: true },
			{ label: "Splits", value: (m) => m.positions_split_count },
			{ label: "Merges", value: (m) => m.positions_merged_count },
		],
	},
];

function formatValue(item: MetricItem, metrics: ComboTimeframeMetrics): string {
	const raw = item.value(metrics);
	if (item.currency) {
		return formatNumber(raw, { compact: true, currency: true });
	}
	return formatNumber(raw, { compact: true, decimals: 0 });
}

function isGroupEmpty(group: MetricGroup, metrics: ComboTimeframeMetrics): boolean {
	return group.items.every((item) => !item.value(metrics));
}

export function ComboMetricsClient({ timeframes }: { timeframes: ComboTimeframeMetrics[] }) {
	const ordered = useMemo(() => {
		const rank = (tf: string) => {
			const idx = TIMEFRAME_ORDER.indexOf(tf as (typeof TIMEFRAME_ORDER)[number]);
			return idx === -1 ? TIMEFRAME_ORDER.length : idx;
		};
		return [...timeframes].sort((a, b) => rank(a.timeframe) - rank(b.timeframe));
	}, [timeframes]);

	const defaultTimeframe = useMemo(
		() => ordered.find((t) => t.timeframe === "lifetime")?.timeframe ?? ordered[0]?.timeframe ?? "",
		[ordered],
	);

	const [selected, setSelected] = useState(defaultTimeframe);

	const active = ordered.find((t) => t.timeframe === selected) ?? ordered[0] ?? null;
	const groups = active
		? GROUPS.filter((group) => !group.hideWhenEmpty || !isGroupEmpty(group, active))
		: [];

	return (
		<section className="bg-card rounded-lg p-4 sm:p-6">
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm text-foreground sm:text-base">Metrics</p>
				{ordered.length > 1 ? (
					<ToggleGroup
						value={[selected]}
						onValueChange={(raw) => {
							const next = Array.isArray(raw) ? raw[0] : raw;
							if (next) setSelected(next);
						}}
						variant="outline"
						size="sm"
					>
						{ordered.map((tf) => (
							<ToggleGroupItem
								key={tf.timeframe}
								value={tf.timeframe}
								aria-label={`Show ${timeframeLabel(tf.timeframe)} metrics`}
							>
								{timeframeLabel(tf.timeframe)}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
				) : null}
			</div>

			<Separator className="my-3 sm:my-4" />

			{active ? (
				groups.map((group, index) => (
					<Fragment key={group.key}>
						{index > 0 ? <Separator className="my-3 sm:my-4" /> : null}
						<div>
							<p className="mb-2 text-sm text-foreground/90 sm:mb-3">{group.title}</p>
							<div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
								{group.items.map((item) => (
									<div key={item.label} className="min-w-0">
										<p className="truncate text-xs text-muted-foreground sm:text-sm">
											{item.label}
										</p>
										<p className="mt-0.5 truncate text-sm font-medium tabular-nums sm:text-base">
											{formatValue(item, active)}
										</p>
									</div>
								))}
							</div>
						</div>
					</Fragment>
				))
			) : (
				<p className="text-sm text-muted-foreground">No metrics available yet.</p>
			)}
		</section>
	);
}
