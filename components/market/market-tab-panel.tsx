import { Suspense } from "react";

import { MarketHolders, MarketHoldersFallback } from "@/components/market/market-holders";
import { MarketHoldersHistory, MarketHoldersHistoryFallback } from "@/components/market/market-holders-history";
import { MarketPriceSpikes, MarketPriceSpikesFallback } from "@/components/market/market-price-spikes";
import { MarketTabs } from "@/components/market/market-tabs";
import { MarketTrades, MarketTradesFallback } from "@/components/market/market-trades";
import type { MarketDetailTab } from "@/lib/market-detail-search-params-shared";

type MarketTabPanelProps = {
	currentTab: MarketDetailTab;
	slug: string;
	conditionId: string;
	tradesPage: number;
};

export function MarketTabPanel({ currentTab, slug, conditionId, tradesPage }: MarketTabPanelProps) {
	return (
		<div className="space-y-4">
			<MarketTabs />
			<MarketTabContent currentTab={currentTab} slug={slug} conditionId={conditionId} tradesPage={tradesPage} />
		</div>
	);
}

function MarketTabContent({ currentTab, slug, conditionId, tradesPage }: MarketTabPanelProps) {
	switch (currentTab) {
		case "spikes":
			return (
				<Suspense fallback={<MarketPriceSpikesFallback />}>
					<MarketPriceSpikes conditionId={conditionId} />
				</Suspense>
			);
		case "holders":
			return (
				<Suspense fallback={<MarketHoldersFallback />}>
					<MarketHolders slug={slug} />
				</Suspense>
			);
		case "holders-history":
			return (
				<Suspense fallback={<MarketHoldersHistoryFallback />}>
					<MarketHoldersHistory conditionId={conditionId} />
				</Suspense>
			);
		case "trades":
		default:
			return (
				<Suspense fallback={<MarketTradesFallback />}>
					<MarketTrades conditionId={conditionId} pageNumber={tradesPage} />
				</Suspense>
			);
	}
}

export function MarketTabPanelFallback() {
	return <MarketTradesFallback />;
}
