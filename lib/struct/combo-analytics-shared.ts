import type {
	AnalyticsChangeTimeframe,
	ComboGlobalAnalyticsBucketRow,
	ComboGlobalAnalyticsDeltaBucketRow,
} from "@structbuild/sdk";

import type {
	AnalyticsRange,
	AnalyticsResolution,
} from "@/lib/struct/analytics-shared";

export type ComboAnalyticsRow =
	| ComboGlobalAnalyticsBucketRow
	| ComboGlobalAnalyticsDeltaBucketRow;

export type ComboAnalyticsPoint = { t: number } & Record<string, number>;

const COMBO_FIELD_MAP: Record<string, string> = {
	v: "usd_volume",
	bv: "usd_buy_volume",
	sv: "usd_sell_volume",
	sh: "shares_volume",
	bsh: "shares_buy_volume",
	ssh: "shares_sell_volume",
	f: "fees",
	bf: "builder_fees",
	buv: "builder_usd_volume",
	bubv: "builder_usd_buy_volume",
	busv: "builder_usd_sell_volume",
	bsv: "builder_shares_volume",
	bsbv: "builder_shares_buy_volume",
	bssv: "builder_shares_sell_volume",
	tc: "txns",
	bc: "buys",
	sc: "sells",
	btc: "builder_txns",
	bbc: "builder_buys",
	bsc: "builder_sells",
	cre: "creations",
	exe: "executions",
	su: "status_updates",
	ps: "positions_split",
	pm: "positions_merged",
	soc: "split_on_condition",
	moc: "merged_on_condition",
	ext: "extracted",
	inj: "injected",
	ctyb: "converted_to_yes_basket",
	mfyb: "merged_from_yes_basket",
	cmp: "compressed",
	red: "redeemed",
	wr: "wrapped",
	uw: "unwrapped",
	hs: "horizontal_split",
	hm: "horizontal_merge",
	pc: "position_converted",
	mig: "migrated",
	binv: "binary_usd_volume",
	nrv: "negrisk_usd_volume",
	cv: "combinatorial_usd_volume",
	yv: "yes_usd_volume",
	ysh: "yes_shares_volume",
	ybsh: "yes_shares_buy_volume",
	yssh: "yes_shares_sell_volume",
	nv: "no_usd_volume",
	nsh: "no_shares_volume",
	l2t: "legs_2_txns",
	l2v: "legs_2_usd_volume",
	l3t: "legs_3_txns",
	l3v: "legs_3_usd_volume",
	l4t: "legs_4_txns",
	l4v: "legs_4_usd_volume",
	l5t: "legs_5_plus_txns",
	l5v: "legs_5_plus_usd_volume",
	epw: "entry_price_usd_weighted_sum",
	scu: "split_collateral_usd",
	mcu: "merge_collateral_usd",
	rpu: "redemption_payout_usd",
	rsh: "redemption_shares",
	ccu: "compress_collateral_usd",
	ccr: "combos_created",
	cry: "combos_resolved_yes",
	crn: "combos_resolved_no",
	nct: "new_combo_traders",
	nbct: "new_builder_combo_traders",
	ut: "unique_traders",
	dct: "distinct_combos_traded",
};

export function toComboAnalyticsPoint(row: ComboAnalyticsRow): ComboAnalyticsPoint {
	const source = row as unknown as Record<string, number>;
	const point: ComboAnalyticsPoint = { t: typeof source.t === "number" ? source.t : 0 };
	for (const short in COMBO_FIELD_MAP) {
		const value = source[short];
		point[COMBO_FIELD_MAP[short]] = typeof value === "number" ? value : 0;
	}
	return point;
}

const FIXED_RESOLUTION_SECONDS: Record<AnalyticsResolution, number> = {
	"60": 3600,
	"240": 14400,
	D: 86400,
	W: 7 * 86400,
	M: 30 * 86400,
};

const RANGE_SECONDS: Record<Exclude<AnalyticsRange, "all">, number> = {
	"1d": 86400,
	"7d": 7 * 86400,
	"30d": 30 * 86400,
};

const ALL_RANGE_COUNT_BACK: Record<AnalyticsResolution, number> = {
	"60": 500,
	"240": 500,
	D: 500,
	W: 260,
	M: 120,
};

export function computeComboCountBack(
	range: AnalyticsRange,
	resolution: AnalyticsResolution,
): number {
	if (range === "all") return ALL_RANGE_COUNT_BACK[resolution];
	const rangeSec = RANGE_SECONDS[range];
	const stepSec = FIXED_RESOLUTION_SECONDS[resolution];
	if (!stepSec) return 30;
	return Math.ceil(rangeSec / stepSec);
}

const COMBO_CHANGES_TIMEFRAME: Record<AnalyticsRange, AnalyticsChangeTimeframe> = {
	"1d": "24h",
	"7d": "7d",
	"30d": "30d",
	all: "1y",
};

export function comboChangesTimeframe(range: AnalyticsRange): AnalyticsChangeTimeframe {
	return COMBO_CHANGES_TIMEFRAME[range];
}

export type ComboChartSeries = {
	key: string;
	label: string;
	color: string;
	stackId?: string;
	isTotal?: boolean;
};

export type ComboChartMetric = {
	id: string;
	title: string;
	description?: string;
	valueFormat: "currency" | "count";
	series: ComboChartSeries[];
};

const STACK = "combo";

export const COMBO_CHART_METRICS: ComboChartMetric[] = [
	{
		id: "volume",
		title: "Combo volume",
		description: "USD volume across combo fills, split by buys and sells.",
		valueFormat: "currency",
		series: [
			{ key: "usd_volume", label: "Volume", color: "var(--chart-2)", isTotal: true },
			{ key: "usd_buy_volume", label: "Buys", color: "var(--chart-1)", stackId: STACK },
			{ key: "usd_sell_volume", label: "Sells", color: "var(--chart-3)", stackId: STACK },
		],
	},
	{
		id: "shares",
		title: "Shares volume",
		description: "Combo shares traded, split by buys and sells.",
		valueFormat: "count",
		series: [
			{ key: "shares_volume", label: "Shares", color: "var(--chart-2)", isTotal: true },
			{ key: "shares_buy_volume", label: "Buys", color: "var(--chart-1)", stackId: STACK },
			{ key: "shares_sell_volume", label: "Sells", color: "var(--chart-3)", stackId: STACK },
		],
	},
	{
		id: "fills",
		title: "Combo fills",
		description: "Combo fill count, split by buys and sells.",
		valueFormat: "count",
		series: [
			{ key: "txns", label: "Fills", color: "var(--chart-2)", isTotal: true },
			{ key: "buys", label: "Buys", color: "var(--chart-1)", stackId: STACK },
			{ key: "sells", label: "Sells", color: "var(--chart-3)", stackId: STACK },
		],
	},
	{
		id: "sides",
		title: "YES vs NO volume",
		description: "USD volume on the YES and NO sides of combo markets.",
		valueFormat: "currency",
		series: [
			{ key: "yes_usd_volume", label: "YES", color: "var(--chart-1)", stackId: STACK },
			{ key: "no_usd_volume", label: "NO", color: "var(--chart-3)", stackId: STACK },
		],
	},
	{
		id: "legs",
		title: "Volume by leg count",
		description: "USD volume split across 2, 3, 4 and 5+ leg combos.",
		valueFormat: "currency",
		series: [
			{ key: "legs_2_usd_volume", label: "2 legs", color: "var(--chart-1)", stackId: STACK },
			{ key: "legs_3_usd_volume", label: "3 legs", color: "var(--chart-2)", stackId: STACK },
			{ key: "legs_4_usd_volume", label: "4 legs", color: "var(--chart-3)", stackId: STACK },
			{ key: "legs_5_plus_usd_volume", label: "5+ legs", color: "var(--chart-4)", stackId: STACK },
		],
	},
	{
		id: "modules",
		title: "Volume by module",
		description: "USD volume split across binary, neg-risk and combinatorial legs.",
		valueFormat: "currency",
		series: [
			{ key: "binary_usd_volume", label: "Binary", color: "var(--chart-1)", stackId: STACK },
			{ key: "negrisk_usd_volume", label: "Neg-risk", color: "var(--chart-2)", stackId: STACK },
			{
				key: "combinatorial_usd_volume",
				label: "Combinatorial",
				color: "var(--chart-3)",
				stackId: STACK,
			},
		],
	},
	{
		id: "builderVolume",
		title: "Builder-attributed volume",
		description: "USD volume on builder-attributed combo fills, split by buys and sells.",
		valueFormat: "currency",
		series: [
			{ key: "builder_usd_volume", label: "Builder volume", color: "var(--chart-4)", isTotal: true },
			{ key: "builder_usd_buy_volume", label: "Buys", color: "var(--chart-1)", stackId: STACK },
			{ key: "builder_usd_sell_volume", label: "Sells", color: "var(--chart-3)", stackId: STACK },
		],
	},
	{
		id: "fees",
		title: "Fees",
		description: "Total and builder combo fees in USD.",
		valueFormat: "currency",
		series: [
			{ key: "fees", label: "Fees", color: "var(--chart-2)", isTotal: true },
			{ key: "builder_fees", label: "Builder fees", color: "var(--chart-4)" },
		],
	},
	{
		id: "lifecycle",
		title: "Combo lifecycle",
		description: "Combo market creations and executions.",
		valueFormat: "count",
		series: [
			{ key: "creations", label: "Creations", color: "var(--chart-1)" },
			{ key: "executions", label: "Executions", color: "var(--chart-2)" },
		],
	},
	{
		id: "resolutions",
		title: "Resolutions",
		description: "Combos resolved YES vs NO.",
		valueFormat: "count",
		series: [
			{ key: "combos_resolved_yes", label: "Resolved YES", color: "var(--chart-1)", stackId: STACK },
			{ key: "combos_resolved_no", label: "Resolved NO", color: "var(--chart-3)", stackId: STACK },
		],
	},
	{
		id: "newTraders",
		title: "New combo traders",
		description: "First-time combo traders and first-time builder-attributed combo traders.",
		valueFormat: "count",
		series: [
			{ key: "new_combo_traders", label: "New traders", color: "var(--chart-5)" },
			{ key: "new_builder_combo_traders", label: "New builder traders", color: "var(--chart-4)" },
		],
	},
];
