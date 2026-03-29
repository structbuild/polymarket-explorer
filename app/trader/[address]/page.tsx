import { PerformanceSummary } from "@/components/trader/performance-summary";
import { PnlCalendar } from "@/components/trader/pnl-calendar";
import { PnlCard } from "@/components/trader/pnl-card";
import { TraderHeader } from "@/components/trader/trader-header";
import { TraderInfo } from "@/components/trader/trader-info";
import { TraderTabs } from "@/components/trader/trader-tabs";
import { computeStreaks, getPnlChartAnnotations, getTraderDailyPnl, getTraderPnlCandles } from "@/lib/polymarket/pnl";
import { PNL_TIMEFRAMES } from "@/lib/polymarket/pnl-timeframes";
import { loadTraderSearchParams } from "@/lib/trader-search-params.server";
import { defaultTraderTablePageSize, getMarketsByConditionIds, getTraderPnlSummary, getTraderPositionsPage, getTraderProfile, getTraderTradesPage } from "@/lib/struct/queries";
import { getTraderDisplayName } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = {
	params: Promise<{ address: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { address } = await params;
	const profile = await getTraderProfile(address);
	const displayName = profile ? getTraderDisplayName({ address, name: profile.name, pseudonym: profile.pseudonym }) : address;
	const description = `Analyze ${displayName}'s Polymarket trading performance — PnL history, win rate, volume, and recent trades. Powered by Struct.`;

	return {
		title: `${displayName} — Trader Profile`,
		description,
		alternates: {
			canonical: `/trader/${address}`,
		},
		openGraph: {
			title: `${displayName} — Polymarket Trader`,
			description,
			type: "profile",
		},
		twitter: {
			card: "summary",
			title: `${displayName} — Polymarket Trader`,
			description,
		},
	};
}

export default async function TraderPage({ params, searchParams }: Props) {
	const { address } = await params;
	const { openPage, closedPage, activityPage, pnlTimeframe } = await loadTraderSearchParams(searchParams);
	const pageSize = defaultTraderTablePageSize;
	const openOffset = (openPage - 1) * pageSize;
	const closedOffset = (closedPage - 1) * pageSize;
	const activityOffset = (activityPage - 1) * pageSize;

	const { interval, fidelity } = PNL_TIMEFRAMES[pnlTimeframe];
	const [profile, pnlSummary, pnlCandles, dailyPnl, openPositions, closedPositions, trades] = await Promise.all([
		getTraderProfile(address),
		getTraderPnlSummary(address),
		getTraderPnlCandles(address, interval, fidelity),
		getTraderDailyPnl(address),
		getTraderPositionsPage(address, "open", { limit: pageSize, offset: openOffset }),
		getTraderPositionsPage(address, "closed", { limit: pageSize, offset: closedOffset }),
		getTraderTradesPage(address, { limit: pageSize, offset: activityOffset, sort_desc: true }),
	]);

	if (!profile && !pnlSummary) {
		notFound();
	}

	const tradeConditionIds = [
		...new Set(
			[pnlSummary?.best_trade_condition_id].filter((id): id is string => !!id),
		),
	];
	const tradeMarkets = await getMarketsByConditionIds(tradeConditionIds);
	const bestTradeMarket = tradeMarkets?.find((m) => m.condition_id === pnlSummary?.best_trade_condition_id);

	const streaks = computeStreaks(dailyPnl);
	const chartAnnotations = pnlTimeframe === "all" ? getPnlChartAnnotations(pnlCandles, streaks) : [];
	const displayName = getTraderDisplayName({ address, name: profile?.name, pseudonym: profile?.pseudonym });

	return (
		<div className="flex w-full justify-center">
			<div className="flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 sm:gap-8 sm:px-6 sm:pb-12">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
					<div className="min-w-0 space-y-4 lg:w-2/3">
						<TraderHeader
							address={address}
							displayName={displayName}
							profileImage={profile?.profile_image}
							firstTradeAt={pnlSummary?.first_trade_at}
							totalBuys={pnlSummary?.total_buys}
							totalSells={pnlSummary?.total_sells}
							totalRedemptions={pnlSummary?.total_redemptions}
							totalVolumeUsd={pnlSummary?.total_volume_usd}
						/>
						<PnlCard address={address} data={pnlCandles} displayName={displayName} annotations={chartAnnotations} timeframe={pnlTimeframe} />
						<div className="rounded-lg bg-card p-4 sm:p-6">
							<PnlCalendar data={dailyPnl} />
						</div>
					</div>

					<div className="min-w-0 space-y-4 lg:w-1/3">
						<PerformanceSummary
							pnlSummary={pnlSummary}
							bestTradeMarket={bestTradeMarket}
							streaks={streaks}
						/>
						<TraderInfo address={address} profile={profile} />
					</div>
				</div>

				<TraderTabs
					openPage={openPage}
					closedPage={closedPage}
					activityPage={activityPage}
					openPositions={openPositions}
					closedPositions={closedPositions}
					trades={trades}
				/>
			</div>
		</div>
	);
}
