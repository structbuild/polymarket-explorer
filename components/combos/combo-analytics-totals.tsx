import { Fragment } from "react";

import type { ComboGlobalAnalyticsCountsResponse } from "@structbuild/sdk";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatNumber } from "@/lib/format";

type TotalsItem = {
	label: string;
	value: (counts: ComboGlobalAnalyticsCountsResponse) => number | null;
	currency?: boolean;
	tooltip?: string;
};

type TotalsGroup = {
	key: string;
	title: string;
	items: TotalsItem[];
};

const GROUPS: TotalsGroup[] = [
	{
		key: "volume",
		title: "Volume",
		items: [
			{ label: "Volume", value: (c) => c.usd_volume, currency: true },
			{ label: "Buy volume", value: (c) => c.usd_buy_volume, currency: true },
			{ label: "Sell volume", value: (c) => c.usd_sell_volume, currency: true },
			{ label: "Shares volume", value: (c) => c.shares_volume },
			{ label: "Shares buy", value: (c) => c.shares_buy_volume },
			{ label: "Shares sell", value: (c) => c.shares_sell_volume },
			{ label: "Fees", value: (c) => c.fees, currency: true },
			{ label: "Fills", value: (c) => c.txns },
			{ label: "Buys", value: (c) => c.buys },
			{ label: "Sells", value: (c) => c.sells },
		],
	},
	{
		key: "builder",
		title: "Builder",
		items: [
			{ label: "Volume", value: (c) => c.builder.builder_usd_volume, currency: true },
			{ label: "Buy volume", value: (c) => c.builder.builder_usd_buy_volume, currency: true },
			{ label: "Sell volume", value: (c) => c.builder.builder_usd_sell_volume, currency: true },
			{ label: "Shares volume", value: (c) => c.builder.builder_shares_volume },
			{ label: "Shares buy", value: (c) => c.builder.builder_shares_buy_volume },
			{ label: "Shares sell", value: (c) => c.builder.builder_shares_sell_volume },
			{ label: "Fees", value: (c) => c.builder.builder_fees, currency: true },
			{ label: "Fills", value: (c) => c.builder.builder_txns },
			{ label: "Buys", value: (c) => c.builder.builder_buys },
			{ label: "Sells", value: (c) => c.builder.builder_sells },
		],
	},
	{
		key: "sides",
		title: "Sides",
		items: [
			{ label: "YES volume", value: (c) => c.sides.yes_usd_volume, currency: true },
			{ label: "NO volume", value: (c) => c.sides.no_usd_volume, currency: true },
			{ label: "YES shares", value: (c) => c.sides.yes_shares_volume },
			{ label: "YES shares buy", value: (c) => c.sides.yes_shares_buy_volume },
			{ label: "YES shares sell", value: (c) => c.sides.yes_shares_sell_volume },
			{ label: "NO shares", value: (c) => c.sides.no_shares_volume },
		],
	},
	{
		key: "legs",
		title: "Legs",
		items: [
			{ label: "2-leg volume", value: (c) => c.legs.legs_2_usd_volume, currency: true },
			{ label: "2-leg fills", value: (c) => c.legs.legs_2_txns },
			{ label: "3-leg volume", value: (c) => c.legs.legs_3_usd_volume, currency: true },
			{ label: "3-leg fills", value: (c) => c.legs.legs_3_txns },
			{ label: "4-leg volume", value: (c) => c.legs.legs_4_usd_volume, currency: true },
			{ label: "4-leg fills", value: (c) => c.legs.legs_4_txns },
			{ label: "5+ leg volume", value: (c) => c.legs.legs_5_plus_usd_volume, currency: true },
			{ label: "5+ leg fills", value: (c) => c.legs.legs_5_plus_txns },
		],
	},
	{
		key: "marketsUsers",
		title: "Markets & users",
		items: [
			{ label: "Combos created", value: (c) => c.combos.combos_created },
			{ label: "Resolved YES", value: (c) => c.combos.combos_resolved_yes },
			{ label: "Resolved NO", value: (c) => c.combos.combos_resolved_no },
			{ label: "New traders", value: (c) => c.users.new_combo_traders },
			{ label: "New builder traders", value: (c) => c.users.new_builder_combo_traders },
		],
	},
	{
		key: "current",
		title: "Current",
		items: [
			{
				label: "Open combos",
				value: (c) => c.current?.combos_open ?? null,
				tooltip:
					"Approximate open combos: created minus resolved. Expired-but-unresolved markets still count as open; the value can go negative when resolutions land for combos created before indexing coverage.",
			},
			{
				label: "Net YES shares",
				value: (c) => c.current?.net_yes_shares_outstanding ?? null,
				tooltip:
					"Approximate net YES shares outstanding: YES shares bought minus sold minus redeemed. Ignores splits, merges, transforms, and activity before indexing coverage.",
			},
		],
	},
	{
		key: "settlement",
		title: "Settlement",
		items: [
			{ label: "Executions", value: (c) => c.lifecycle.executions },
			{ label: "Redeemed", value: (c) => c.lifecycle.redeemed },
			{ label: "Redemption payout", value: (c) => c.lifecycle.redemption_payout_usd, currency: true },
			{ label: "Split collateral", value: (c) => c.lifecycle.split_collateral_usd, currency: true },
			{ label: "Merge collateral", value: (c) => c.lifecycle.merge_collateral_usd, currency: true },
			{ label: "Compress collateral", value: (c) => c.lifecycle.compress_collateral_usd, currency: true },
		],
	},
	{
		key: "lifecycleOps",
		title: "Lifecycle ops",
		items: [
			{ label: "Creations", value: (c) => c.lifecycle.creations },
			{ label: "Status updates", value: (c) => c.lifecycle.status_updates },
			{ label: "Positions split", value: (c) => c.lifecycle.positions_split },
			{ label: "Positions merged", value: (c) => c.lifecycle.positions_merged },
			{ label: "Split on condition", value: (c) => c.lifecycle.split_on_condition },
			{ label: "Merge on condition", value: (c) => c.lifecycle.merged_on_condition },
			{ label: "Extracted", value: (c) => c.lifecycle.extracted },
			{ label: "Injected", value: (c) => c.lifecycle.injected },
			{ label: "To YES basket", value: (c) => c.lifecycle.converted_to_yes_basket },
			{ label: "From YES basket", value: (c) => c.lifecycle.merged_from_yes_basket },
			{ label: "Compressed", value: (c) => c.lifecycle.compressed },
			{ label: "Wrapped", value: (c) => c.lifecycle.wrapped },
			{ label: "Unwrapped", value: (c) => c.lifecycle.unwrapped },
			{ label: "Horizontal split", value: (c) => c.lifecycle.horizontal_split },
			{ label: "Horizontal merge", value: (c) => c.lifecycle.horizontal_merge },
			{ label: "Position converted", value: (c) => c.lifecycle.position_converted },
			{ label: "Migrated", value: (c) => c.lifecycle.migrated },
		],
	},
];

function formatValue(item: TotalsItem, counts: ComboGlobalAnalyticsCountsResponse): string {
	const raw = item.value(counts);
	if (raw === null) return "—";
	if (item.currency) {
		return formatNumber(raw, { compact: true, currency: true });
	}
	return formatNumber(raw, { compact: true });
}

function groupHasValues(group: TotalsGroup, counts: ComboGlobalAnalyticsCountsResponse): boolean {
	return group.items.some((item) => item.value(counts) !== null);
}

type ComboAnalyticsTotalsProps = {
	counts: ComboGlobalAnalyticsCountsResponse;
};

export function ComboAnalyticsTotals({ counts }: ComboAnalyticsTotalsProps) {
	const groups = GROUPS.filter((group) => groupHasValues(group, counts));

	return (
		<section className="bg-card rounded-lg p-4 sm:p-6">
			<p className="text-sm text-foreground sm:text-base">Totals</p>
			<Separator className="my-3 sm:my-4" />
			{groups.map((group, index) => (
				<Fragment key={group.key}>
					{index > 0 ? <Separator className="my-3 sm:my-4" /> : null}
					<div>
						<p className="mb-2 text-sm text-foreground/90 sm:mb-3">{group.title}</p>
						<div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
							{group.items.map((item) => {
								const raw = item.value(counts);
								if (raw === null) return null;
								return (
									<div key={item.label} className="min-w-0">
										<div className="flex items-center gap-1">
											<p className="truncate text-xs text-muted-foreground sm:text-sm">
												{item.label}
											</p>
											{item.tooltip ? <InfoTooltip content={item.tooltip} /> : null}
										</div>
										<p className="mt-0.5 truncate text-sm font-medium tabular-nums sm:text-base">
											{formatValue(item, counts)}
										</p>
									</div>
								);
							})}
						</div>
					</div>
				</Fragment>
			))}
		</section>
	);
}

export function ComboAnalyticsTotalsFallback() {
	return (
		<section className="bg-card rounded-lg p-4 sm:p-6">
			<Skeleton className="h-5 w-16" />
			<Separator className="my-3 sm:my-4" />
			{Array.from({ length: 4 }, (_, group) => (
				<div key={group}>
					{group > 0 ? <Separator className="my-3 sm:my-4" /> : null}
					<Skeleton className="mb-2 h-5 w-20 sm:mb-3" />
					<div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{Array.from({ length: group === 0 ? 10 : 6 }, (_, i) => (
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
