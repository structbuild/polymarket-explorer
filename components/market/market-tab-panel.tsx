import { getMarketTabPageAction } from "@/app/actions";
import { MarketTabPanelClient } from "@/components/market/market-tab-panel-client";
import { MarketTradesFallback } from "@/components/market/market-trades";
import type { MarketDetailTab } from "@/lib/market-detail-search-params-shared";

type MarketTabPanelProps = {
	currentTab: MarketDetailTab;
	slug: string;
	conditionId: string;
	tradesPage: number;
};

export async function MarketTabPanel({ currentTab, slug, conditionId, tradesPage }: MarketTabPanelProps) {
	const params = new URLSearchParams();
	params.set("tradesPage", String(tradesPage));
	const initialData = await getMarketTabPageAction({
		slug,
		conditionId,
		tab: currentTab,
		search: params.toString(),
	});

	return <MarketTabPanelClient initialData={initialData} />;
}

export function MarketTabPanelFallback() {
	return <MarketTradesFallback />;
}
