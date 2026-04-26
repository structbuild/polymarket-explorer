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

function fallbackForTab(tab: MarketDetailTab) {
	switch (tab) {
		case "spikes":
			return <MarketPriceSpikesFallback />;
		case "holders":
			return <MarketHoldersFallback />;
		case "holders-history":
			return <MarketHoldersHistoryFallback />;
		case "trades":
		default:
			return <MarketTradesFallback />;
	}
}

function MarketTabContent({ currentTab, slug, conditionId, tradesPage }: MarketTabPanelProps) {
	switch (currentTab) {
		case "spikes":
			return <MarketPriceSpikes conditionId={conditionId} />;
		case "holders":
			return <MarketHolders slug={slug} />;
		case "holders-history":
			return <MarketHoldersHistory conditionId={conditionId} />;
		case "trades":
		default:
			return <MarketTrades conditionId={conditionId} pageNumber={tradesPage} />;
	}
}

export function MarketTabPanel({ currentTab, slug, conditionId, tradesPage }: MarketTabPanelProps) {
	return (
		<div className="space-y-4">
			<MarketTabs />
			<Suspense fallback={fallbackForTab(currentTab)}>
				<MarketTabContent
					currentTab={currentTab}
					slug={slug}
					conditionId={conditionId}
					tradesPage={tradesPage}
				/>
			</Suspense>
		</div>
	);
}

export function MarketTabPanelFallback() {
	return <MarketTradesFallback />;
}
