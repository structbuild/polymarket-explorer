import { HomeActivityTabs } from "@/components/home/home-activity-tabs";
import { HomeSearchTrigger } from "@/components/home/home-search-trigger";
import { NewMarketsList, NewMarketsListFallback } from "@/components/home/new-markets-list";
import { PlatformStats, PlatformStatsFallback } from "@/components/home/platform-stats";
import { RecentTradesList, RecentTradesListFallback } from "@/components/home/recent-trades-list";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: `${SITE_NAME} · Live Odds, Traders & Analytics`,
	description: "Live Polymarket prediction markets, top trader leaderboard, historical odds, and analytics in one place.",
	alternates: {
		canonical: "/",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function HomePage() {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
			<div className="mb-8 flex flex-col gap-2.5">
				<h1 className="shrink-0 text-lg font-medium text-foreground/90">Explore markets, traders, tags on Polymarket</h1>
				<div className="w-full sm:max-w-2/3">
					<HomeSearchTrigger />
				</div>
			</div>

			<div className="space-y-6 sm:space-y-10">
				<Suspense fallback={<PlatformStatsFallback />}>
					<PlatformStats />
				</Suspense>

				<HomeActivityTabs
					markets={
						<Suspense fallback={<NewMarketsListFallback />}>
							<NewMarketsList />
						</Suspense>
					}
					trades={
						<Suspense fallback={<RecentTradesListFallback />}>
							<RecentTradesList />
						</Suspense>
					}
				/>
			</div>
		</div>
	);
}
