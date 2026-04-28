"use client";

import { useCallback, useRef, useState, useTransition } from "react";

import { getMarketTabPageAction } from "@/app/actions";
import { ChartCard } from "@/components/market/chart-card";
import { MarketHoldersClient } from "@/components/market/market-holders-client";
import { MarketHoldersHistoryClient } from "@/components/market/market-holders-history-client";
import { MarketPriceSpikesTable } from "@/components/market/market-price-spikes-table";
import { MarketTabs } from "@/components/market/market-tabs";
import { MarketTradesTable } from "@/components/market/market-trades-table";
import {
	defaultMarketDetailTab,
	type MarketDetailTab,
} from "@/lib/market-detail-search-params-shared";

type MarketTabPanelData = Awaited<ReturnType<typeof getMarketTabPageAction>>;

function replaceMarketTabUrl(tab: MarketDetailTab) {
	const params = new URLSearchParams(window.location.search);

	if (tab === defaultMarketDetailTab) {
		params.delete("tab");
	} else {
		params.set("tab", tab);
	}

	const search = params.toString();
	const href = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
	window.history.pushState(window.history.state, "", href);

	return search;
}

function tabForPanelData(data: MarketTabPanelData): MarketDetailTab {
	return data.kind;
}

function renderPanelData(data: MarketTabPanelData) {
	switch (data.kind) {
		case "holders":
			if (!data.data?.outcomes?.length) {
				return (
					<div className="rounded-lg bg-card px-4 py-12 text-center text-sm text-muted-foreground sm:px-6">
						No holders yet
					</div>
				);
			}

			return <MarketHoldersClient outcomes={data.data.outcomes} />;
		case "spikes":
			return <MarketPriceSpikesTable spikes={data.spikes} />;
		case "holders-history":
			if (data.data.length === 0) {
				return (
					<ChartCard>
						<p className="py-8 text-center text-sm text-muted-foreground">No holder history yet</p>
					</ChartCard>
				);
			}

			return (
				<ChartCard>
					<MarketHoldersHistoryClient data={data.data} />
				</ChartCard>
			);
		case "trades":
		default:
			return (
				<MarketTradesTable
					conditionId={data.conditionId}
					page={data.page}
					pageNumber={data.pageNumber}
				/>
			);
	}
}

export function MarketTabPanelClient({
	initialData,
}: {
	initialData: MarketTabPanelData;
}) {
	const [isPending, startTransition] = useTransition();
	const requestIdRef = useRef(0);
	const [panelState, setPanelState] = useState(() => ({
		sourceData: initialData,
		data: initialData,
	}));
	const currentData = panelState.sourceData === initialData ? panelState.data : initialData;
	const currentTab = tabForPanelData(currentData);

	const handleTabChange = useCallback((nextTab: MarketDetailTab) => {
		if (nextTab === currentTab) {
			return;
		}

		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;
		const search = replaceMarketTabUrl(nextTab);

		startTransition(async () => {
			const data = await getMarketTabPageAction({
				slug: currentData.slug,
				conditionId: currentData.conditionId,
				tab: nextTab,
				search,
			});

			if (requestIdRef.current === requestId) {
				setPanelState({
					sourceData: initialData,
					data,
				});
			}
		});
	}, [currentData.conditionId, currentData.slug, currentTab, initialData]);

	return (
		<div className="space-y-4">
			<MarketTabs
				value={currentTab}
				onValueChange={handleTabChange}
				pending={isPending}
			/>
			{renderPanelData(currentData)}
		</div>
	);
}
