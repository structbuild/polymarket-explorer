"use client";

import { useCallback, useTransition } from "react";
import { useQueryStates } from "nuqs";
import posthog from "posthog-js";

import { marketDetailSearchParamParsers } from "@/lib/market-detail-search-params";
import {
	marketDetailTabValues,
	type MarketDetailTab,
} from "@/lib/market-detail-search-params-shared";
import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const tabLabels: Record<MarketDetailTab, string> = {
	trades: "Trades",
	holders: "Holders",
	spikes: "Price Spikes",
	"holders-history": "Holders History",
};

export function MarketTabs({
	value,
	onValueChange,
	pending = false,
	omitTopSpacing = false,
}: {
	value?: MarketDetailTab;
	onValueChange?: (value: MarketDetailTab) => void;
	pending?: boolean;
	omitTopSpacing?: boolean;
}) {
	const [isPending, startTransition] = useTransition();
	const [{ tab: uncontrolledTab }, setSearchParams] = useQueryStates(
		{ tab: marketDetailSearchParamParsers.tab },
		{
			history: "push",
			scroll: false,
			shallow: false,
			startTransition,
		},
	);
	const currentTab = value ?? uncontrolledTab;

	const setTab = useCallback((nextTab: MarketDetailTab) => {
		if (nextTab === currentTab) {
			return;
		}

		posthog.capture("market_tab_changed", { tab: nextTab, previous_tab: currentTab });
		if (onValueChange) {
			onValueChange(nextTab);
			return;
		}

		void setSearchParams({ tab: nextTab });
	}, [currentTab, onValueChange, setSearchParams]);

	return (
		<Tabs value={currentTab} onValueChange={(value) => setTab(value as MarketDetailTab)}>
			<TabsList
				variant="text"
				aria-busy={isPending || pending}
				className={cn(
					"flex w-full justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					!omitTopSpacing && "mt-4",
					(isPending || pending) && "opacity-70",
				)}
			>
				{marketDetailTabValues.map((tab) => (
					<TabsTrigger
						key={tab}
						className="text-base! sm:text-xl!"
						value={tab}
					>
						{tabLabels[tab]}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}
