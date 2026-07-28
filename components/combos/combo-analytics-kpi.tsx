import type {
	ComboGlobalAnalyticsChanges,
	ComboGlobalAnalyticsCountsResponse,
} from "@structbuild/sdk";

import { formatPctChange, pctToneClass } from "@/components/analytics/pct-display";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatNumber, formatPriceCents } from "@/lib/format";

function formatMultiplier(value: number): string {
	return `${value.toFixed(2)}×`;
}

function formatPercent(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

type ComboSecondarySpec = {
	value: (counts: ComboGlobalAnalyticsCountsResponse) => number | null | undefined;
	format: (value: number) => string;
	pctKey?: keyof ComboGlobalAnalyticsChanges;
};

type ComboKpiSpec = {
	key: string;
	label: string;
	value: (counts: ComboGlobalAnalyticsCountsResponse) => number | null;
	pctKey?: keyof ComboGlobalAnalyticsChanges;
	currency?: boolean;
	tooltip?: string;
	secondary?: ComboSecondarySpec;
};

const ACTIVITY_KPIS: ComboKpiSpec[] = [
	{
		key: "volume",
		label: "Total volume",
		value: (c) => c.usd_volume,
		pctKey: "usd_volume",
		currency: true,
	},
	{
		key: "shares",
		label: "Shares volume",
		value: (c) => c.shares_volume,
		pctKey: "shares_volume",
	},
	{
		key: "fills",
		label: "Fills",
		value: (c) => c.txns,
		pctKey: "txns",
	},
	{
		key: "fees",
		label: "Fees",
		value: (c) => c.fees,
		pctKey: "fees",
		currency: true,
	},
	{
		key: "builderVolume",
		label: "Builder volume",
		value: (c) => c.builder.builder_usd_volume,
		pctKey: "builder_usd_volume",
		currency: true,
	},
	{
		key: "redemptionPayout",
		label: "Redemption payout",
		value: (c) => c.lifecycle.redemption_payout_usd,
		pctKey: "redemption_payout_usd",
		currency: true,
	},
];

const STATE_KPIS: ComboKpiSpec[] = [
	{
		key: "combosCreated",
		label: "Combos created",
		value: (c) => c.combos.combos_created,
		pctKey: "combos_created",
	},
	{
		key: "combosOpen",
		label: "Open combos",
		value: (c) => c.current?.combos_open ?? null,
		tooltip:
			"Approximate open combos: created minus resolved. Expired-but-unresolved markets still count as open; the value can go negative when resolutions land for combos created before indexing coverage.",
	},
	{
		key: "resolved",
		label: "Resolved YES/NO",
		value: (c) => c.combos.combos_resolved_yes,
		pctKey: "combos_resolved_yes",
		secondary: {
			value: (c) => c.combos.combos_resolved_no,
			format: (value) => formatNumber(value, { compact: true }),
			pctKey: "combos_resolved_no",
		},
	},
];

const ACQUISITION_KPIS: ComboKpiSpec[] = [
	{
		key: "newTraders",
		label: "New traders",
		value: (c) => c.users.new_combo_traders,
		pctKey: "new_combo_traders",
	},
	{
		key: "newBuilderTraders",
		label: "New builder traders",
		value: (c) => c.users.new_builder_combo_traders,
		pctKey: "new_builder_combo_traders",
	},
];

type ComboGaugeSpec = {
	key: string;
	label: string;
	value: (counts: ComboGlobalAnalyticsCountsResponse) => number | null | undefined;
	nowKey: keyof ComboGlobalAnalyticsChanges;
	prevKey: keyof ComboGlobalAnalyticsChanges;
	format: (value: number) => string;
	secondary?: ComboSecondarySpec;
};

const GAUGES: ComboGaugeSpec[] = [
	{
		key: "builderShare",
		label: "Builder share",
		value: (c) => c.derived.builder_share_of_volume,
		nowKey: "builder_share_of_volume_now",
		prevKey: "builder_share_of_volume_prev",
		format: formatPercent,
	},
	{
		key: "avgOdds",
		label: "Avg parlay odds",
		value: (c) => c.derived.avg_parlay_odds,
		nowKey: "avg_parlay_odds_now",
		prevKey: "avg_parlay_odds_prev",
		format: formatMultiplier,
	},
	{
		key: "vwapEntry",
		label: "VWAP entry",
		value: (c) => c.derived.vwap_entry_price,
		nowKey: "vwap_entry_price_now",
		prevKey: "vwap_entry_price_prev",
		format: formatPriceCents,
	},
	{
		key: "hitRate",
		label: "Hit rate/payout",
		value: (c) => c.derived.hit_rate,
		nowKey: "hit_rate_now",
		prevKey: "hit_rate_prev",
		format: formatPercent,
		secondary: {
			value: (c) => c.derived.payout_ratio,
			format: formatMultiplier,
		},
	},
];

function readNumber(value: number | null | undefined): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pctOf(value: number | undefined | null): number | null {
	return typeof value === "number" ? value : null;
}

function gaugeChange(now: number | null, prev: number | null): number | null {
	if (now === null || prev === null || prev === 0) return null;
	return now / prev - 1;
}

type ComboTile = {
	key: string;
	label: string;
	value: string;
	pcts: (number | null)[];
	tooltip?: string;
};

function formatWithSecondary(
	primary: string,
	spec: ComboSecondarySpec | undefined,
	counts: ComboGlobalAnalyticsCountsResponse,
): string {
	if (!spec) return primary;
	const raw = readNumber(spec.value(counts));
	if (raw === null) return primary;
	return `${primary} · ${spec.format(raw)}`;
}

function secondaryPct(
	spec: ComboSecondarySpec | undefined,
	counts: ComboGlobalAnalyticsCountsResponse,
	changes: ComboGlobalAnalyticsChanges | null,
): (number | null)[] {
	if (!spec?.pctKey || !changes) return [];
	if (readNumber(spec.value(counts)) === null) return [];
	return [pctOf(changes[spec.pctKey])];
}

function buildKpiTiles(
	specs: ComboKpiSpec[],
	counts: ComboGlobalAnalyticsCountsResponse,
	changes: ComboGlobalAnalyticsChanges | null,
): ComboTile[] {
	const tiles: ComboTile[] = [];
	for (const kpi of specs) {
		const raw = kpi.value(counts);
		if (raw === null) continue;
		tiles.push({
			key: kpi.key,
			label: kpi.label,
			value: formatWithSecondary(
				formatNumber(raw, { compact: true, currency: kpi.currency }),
				kpi.secondary,
				counts,
			),
			pcts: [
				changes && kpi.pctKey ? pctOf(changes[kpi.pctKey]) : null,
				...secondaryPct(kpi.secondary, counts, changes),
			],
			tooltip: kpi.tooltip,
		});
	}
	return tiles;
}

function buildTiles(
	counts: ComboGlobalAnalyticsCountsResponse,
	changes: ComboGlobalAnalyticsChanges | null,
): ComboTile[] {
	const tiles: ComboTile[] = [
		...buildKpiTiles(ACTIVITY_KPIS, counts, changes),
		...buildKpiTiles(STATE_KPIS, counts, changes),
		...buildKpiTiles(ACQUISITION_KPIS, counts, changes),
	];

	for (const gauge of GAUGES) {
		const absolute = readNumber(gauge.value(counts));
		if (absolute === null) continue;
		const now = changes ? readNumber(changes[gauge.nowKey] as number | null | undefined) : null;
		const prev = changes ? readNumber(changes[gauge.prevKey] as number | null | undefined) : null;
		tiles.push({
			key: gauge.key,
			label: gauge.label,
			value: formatWithSecondary(gauge.format(absolute), gauge.secondary, counts),
			pcts: [gaugeChange(now, prev)],
		});
	}

	return tiles;
}

type ComboAnalyticsKpiProps = {
	counts: ComboGlobalAnalyticsCountsResponse;
	changes: ComboGlobalAnalyticsChanges | null;
};

export const COMBO_KPI_GRID_CLASS =
	"grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export const COMBO_KPI_FALLBACK_COUNT = 15;

export function ComboAnalyticsKpi({ counts, changes }: ComboAnalyticsKpiProps) {
	const tiles = buildTiles(counts, changes);

	return (
		<div className={COMBO_KPI_GRID_CLASS}>
			{tiles.map((tile) => {
				const pctLabels = tile.pcts
					.map((pct) => ({ pct, label: formatPctChange(pct) }))
					.filter((entry) => entry.label !== null);
				return (
					<Card key={tile.key} size="sm" className="rounded-lg px-2 ring-0">
						<CardContent className="flex flex-col gap-0.5">
							<div className="flex items-center justify-between gap-2">
								<div className="flex min-w-0 items-center gap-1">
									<p className="truncate text-sm text-muted-foreground">{tile.label}</p>
									{tile.tooltip ? <InfoTooltip content={tile.tooltip} /> : null}
								</div>
								{pctLabels.length ? (
									<p className="shrink-0 text-xs font-medium tabular-nums">
										{pctLabels.map((entry, index) => (
											<span
											key={index}
											className={`${index > 0 ? "hidden sm:inline" : ""} ${pctToneClass(entry.pct)}`}
										>
												{index > 0 ? <span className="text-muted-foreground"> · </span> : null}
												{entry.label}
											</span>
										))}
									</p>
								) : null}
							</div>
							<p className="text-xl font-medium tabular-nums">{tile.value}</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

export function ComboAnalyticsKpiFallback({
	count = COMBO_KPI_FALLBACK_COUNT,
}: {
	count?: number;
}) {
	return (
		<div className={COMBO_KPI_GRID_CLASS}>
			{Array.from({ length: count }).map((_, index) => (
				<Card key={index} size="sm" className="rounded-lg px-2 ring-0">
					<CardContent className="flex flex-col gap-0.5">
						<div className="flex items-center justify-between gap-2">
							<div className="h-5 w-20 animate-pulse rounded bg-muted/70" />
							<div className="h-4 w-10 animate-pulse rounded bg-muted/70" />
						</div>
						<div className="h-7 w-24 animate-pulse rounded bg-muted" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
