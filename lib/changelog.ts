export type ChangelogTag = "new" | "improved" | "fixed";

export type ChangelogEntry = {
	id: string;
	date: string;
	title: string;
	description: string;
	href: string;
	tag?: ChangelogTag;
	image?: string;
};

export const CHANGELOG_RECENT_WINDOW_DAYS = 7;
export const CHANGELOG_SEEN_STORAGE_KEY = "changelog-seen:v2";

const DAY_MS = 24 * 60 * 60 * 1000;

export function entryDateSeconds(entry: ChangelogEntry): number {
	return Math.floor(Date.parse(entry.date) / 1000);
}

export function getRecentChangelogIds(nowMs: number): string[] {
	const cutoff = nowMs - CHANGELOG_RECENT_WINDOW_DAYS * DAY_MS;
	return CHANGELOG.filter((entry) => entryDateSeconds(entry) * 1000 >= cutoff).map((entry) => entry.id);
}

const TRADER_PROFILE_HREF = "/traders/0x2005d16a84ceefa912d4e380cd32e7ff827875ea";
const COMBO_TRADER_HREF = "/traders/0xab444cf90149a8128eb510099e5917f521547ffe";
const COMBO_DETAIL_HREF =
	"/combos/0x037484f03e44221830e5f930e6b6b1905f000000000000000000000000000000";

export const CHANGELOG: ChangelogEntry[] = [
	{
		id: "combos-hub",
		date: "2026-07-27",
		title: "Combos & parlays",
		description:
			"Every Polymarket combo and parlay in one place — ranked by volume, filtered by status, with each leg visible on the row.",
		tag: "new",
		href: "/combos",
	},
	{
		id: "combo-detail",
		date: "2026-07-27",
		title: "Combo market pages",
		description:
			"Open any combo for its price charted against every leg, live implied odds, and a full volume and settlement breakdown.",
		tag: "new",
		href: COMBO_DETAIL_HREF,
	},
	{
		id: "combo-analytics",
		date: "2026-07-27",
		title: "Combo analytics",
		description:
			"Combo activity market-wide: volume by leg count, YES vs NO, builder share and lifecycle, with 16 headline metrics.",
		tag: "new",
		href: "/combos#combos-analytics",
	},
	{
		id: "trader-combos",
		date: "2026-07-27",
		title: "Combos on trader profiles",
		description:
			"A new Combos tab on every trader: PnL per parlay, payout if won, and expandable legs you can filter by status.",
		tag: "new",
		href: `${COMBO_TRADER_HREF}?tab=combos`,
	},
	{
		id: "trader-pnl-by-category",
		date: "2026-07-27",
		title: "PnL by category",
		description:
			"Break any trader's PnL down by category — Politics, Sports, Crypto and more — across both area and candle charts.",
		tag: "improved",
		href: TRADER_PROFILE_HREF,
	},
	{
		id: "builder-compare",
		date: "2026-06-18",
		title: "Compare builders",
		description:
			"Put up to 4 builders side by side — headline metrics, per-bucket activity, trader concentration and category focus, all in one view.",
		tag: "new",
		href: "/builders/compare?codes=0xceebf77a833b30520287ddd9478ff51abbdffa30aa90a8d655dba0e8a79ce0c1,0x11a22276beb720e66a072cba8b8e74cded60afda510af535b947b81a1b81a883,0xbc37cc54237a06aa0d380814fadf2f5b6d20483300833f381e4727f1066845fb,0x4898df15ec6590495dc6c0fedf951ade3e64001d47f9caf44a64e86fc11959df",
	},
	{
		id: "trader-category-leaderboards",
		date: "2026-06-13",
		title: "Trader category leaderboards",
		description:
			"Sort the trader leaderboard by category — Politics, Sports, Crypto and more — with many more columns to compare.",
		tag: "new",
		href: "/traders",
	},
	{
		id: "trader-pnl-chart-updates",
		date: "2026-06-13",
		title: "Trader PnL chart upgrades",
		description:
			"Custom date & time ranges, new chart options, and exit bubbles that mark exactly where positions were closed.",
		tag: "improved",
		href: TRADER_PROFILE_HREF,
	},
	{
		id: "trader-best-worst-trades",
		date: "2026-06-13",
		title: "Best wins & worst losses",
		description:
			"A new breakdown of every trader's most profitable wins and biggest losing trades, market by market.",
		tag: "new",
		href: TRADER_PROFILE_HREF,
	},
	{
		id: "trader-performance-summary",
		date: "2026-06-13",
		title: "Enhanced performance summary",
		description:
			"Far more depth — profit factor, win/loss streaks, drawdown, hold time, rebates and rewards all at a glance.",
		tag: "improved",
		href: TRADER_PROFILE_HREF,
	},
	{
		id: "market-top-traders",
		date: "2026-06-13",
		title: "Market top traders",
		description:
			"See the most profitable traders in any market, with full PnL, volume and share breakdowns.",
		tag: "new",
		href: "/markets/will-jd-vance-win-the-2028-us-presidential-election?tab=top-traders",
	},
	{
		id: "analytics-rewards-incentives",
		date: "2026-06-13",
		title: "Rewards & incentives in Analytics",
		description:
			"Track maker rewards and liquidity incentives across Polymarket over time in the Analytics dashboard.",
		tag: "new",
		href: "/analytics",
	},
];
