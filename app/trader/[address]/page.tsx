import { PerformanceSummary } from "@/components/trader/performance-summary";
import { PnlCalendar } from "@/components/trader/pnl-calendar";
import { PnlChart } from "@/components/trader/pnl-chart";
import { TraderHeader } from "@/components/trader/trader-header";
import { TraderInfo } from "@/components/trader/trader-info";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMarketsByConditionIds, getTraderDailyPnlCandles, getTraderPnlCandles, getTraderPnlSummary, getTraderProfile } from "@/lib/struct/queries";
import { getTraderDisplayName } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = {
	params: Promise<{ address: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { address } = await params;
	const profile = await getTraderProfile(address);
	const displayName = profile ? getTraderDisplayName({ address, name: profile.name, pseudonym: profile.pseudonym }) : address;
	const description = `Analyze ${displayName}'s Polymarket trading performance — PnL history, win rate, volume, and recent trades.`;

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

export default async function TraderPage({ params }: Props) {
	const { address } = await params;

	const [profile, pnlSummary, pnlCandles, dailyCandles] = await Promise.all([
		getTraderProfile(address),
		getTraderPnlSummary(address),
		getTraderPnlCandles(address),
		getTraderDailyPnlCandles(address),
	]);

	if (!profile && !pnlSummary) {
		notFound();
	}

	const tradeConditionIds = [pnlSummary?.best_trade_condition_id].filter((id): id is string => !!id);
	const tradeMarkets = await getMarketsByConditionIds(tradeConditionIds);
	const bestTradeMarket = tradeMarkets?.find((m) => m.condition_id === pnlSummary?.best_trade_condition_id);

	const displayName = getTraderDisplayName({ address, name: profile?.name, pseudonym: profile?.pseudonym });

	return (
		<div className="flex justify-center w-full min-h-svh">
			<div className="flex flex-col gap-10 max-w-7xl p-6 pt-0 w-full">
				<div className="flex gap-6 items-start">
					<div className="w-2/3 space-y-4">
						<TraderHeader
							address={address}
							displayName={displayName}
							profileImage={profile?.profile_image}
							firstTradeAt={pnlSummary?.first_trade_at}
							totalBuys={pnlSummary?.total_buys}
							totalSells={pnlSummary?.total_sells}
							totalVolumeUsd={pnlSummary?.total_volume_usd}
						/>
						<div className="p-6 rounded-lg bg-card">
							<PnlChart data={pnlCandles ?? []} />
						</div>
						<div className="p-6 rounded-lg bg-card">
							<PnlCalendar data={dailyCandles ?? []} />
						</div>
					</div>

					<div className="w-1/3 h-full space-y-4">
						<PerformanceSummary pnlSummary={pnlSummary} bestTradeMarket={bestTradeMarket} />
						<TraderInfo address={address} profile={profile} />
					</div>
				</div>

                <Tabs>
                    <TabsList variant="text">
                        <TabsTrigger className="" value="active">Active Positions</TabsTrigger>
                        <TabsTrigger value="closed">Closed Positions</TabsTrigger>
                        <TabsTrigger value="activity">Recent Trades</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active"></TabsContent>
                    <TabsContent value="closed"></TabsContent>
                    <TabsContent value="activity"></TabsContent>
                </Tabs>
			</div>
		</div>
	);
}
