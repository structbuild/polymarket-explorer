import { MarketTabPanelClient } from "@/components/market/market-tab-panel-client";
import { MarketTradesFallback } from "@/components/market/market-trades";
import type { MarketDetailTab } from "@/lib/market-detail-search-params-shared";
import { loadMarketTabPage } from "@/lib/struct/market-tab-page";

type MarketTabPanelProps = {
	currentTab: MarketDetailTab;
	slug: string;
	conditionId: string;
	tradesPage: number;
	totalHolders?: number | null;
};

export async function MarketTabPanel({ currentTab, slug, conditionId, tradesPage, totalHolders }: MarketTabPanelProps) {
	const params = new URLSearchParams();
	params.set("tradesPage", String(tradesPage));
	const initialData = await loadMarketTabPage({
		slug,
		conditionId,
		tab: currentTab,
		search: params.toString(),
	});

	return <MarketTabPanelClient initialData={initialData} totalHolders={totalHolders} />;
}

export function MarketTabPanelFallback() {
	return <MarketTradesFallback />;
}
