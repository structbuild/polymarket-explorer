"use client";

import posthog from "posthog-js";
import { useCallback, useRef, useState, useTransition } from "react";

import { getHomeActivityDataAction } from "@/app/actions";
import { BestTradesListClient } from "@/components/home/best-trades-list-client";
import { HomeRefreshButton } from "@/components/home/home-refresh-button";
import { RecentTradesTable } from "@/components/home/recent-trades-table";
import { MarketsTable } from "@/components/market/markets-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeframeToggle } from "@/components/ui/timeframe-toggle";
import type { HomeActivityData, HomeActivityTab } from "@/lib/home-activity";
import { METRICS_TIMEFRAMES } from "@/lib/timeframes";

export function HomeTabsBar({ pending = false }: { pending?: boolean }) {
	return (
		<TabsList
			variant="text"
			className="flex w-full max-w-full min-w-0 justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			<TabsTrigger className="text-lg! sm:text-xl!" value="trades" disabled={pending}>Recent Trades</TabsTrigger>
			<TabsTrigger className="text-lg! sm:text-xl!" value="trending" disabled={pending}>Trending Markets</TabsTrigger>
			<TabsTrigger className="text-lg! sm:text-xl!" value="bestTrades" disabled={pending}>Best Wins</TabsTrigger>
			<TabsTrigger className="text-lg! sm:text-xl!" value="markets" disabled={pending}>New Markets</TabsTrigger>
		</TabsList>
	);
}

function HomeActivityContent({
	data,
	onRefresh,
}: {
	data: HomeActivityData;
	onRefresh: () => Promise<void>;
}) {
	switch (data.kind) {
		case "trending":
			return (
				<MarketsTable
					markets={data.markets}
					storageKey="home-trending-markets"
					paginationMode="none"
					sortingMode="client"
					homeToolbarGrid
					toolbarAfterTimeframe={<HomeRefreshButton onRefresh={onRefresh} />}
				/>
			);
		case "bestTrades":
			return <BestTradesListClient key="best-trades" initialTrades={data.trades} initialTimeframe="1d" limit={12} />;
		case "markets":
			return (
				<MarketsTable
					markets={data.markets}
					storageKey="home-new-markets"
					paginationMode="none"
					homeToolbarGrid
					toolbarAfterTimeframe={<HomeRefreshButton onRefresh={onRefresh} />}
				/>
			);
		case "trades":
		default:
			return (
				<RecentTradesTable
					trades={data.trades}
					homeToolbarGrid
					toolbarAfterTimeframe={<HomeRefreshButton onRefresh={onRefresh} />}
				/>
			);
	}
}

function HomeActivityFallback() {
	return (
		<>
			<div
				aria-hidden="true"
				className="invisible pointer-events-none flex w-full flex-col gap-3 justify-self-end sm:col-start-2 sm:row-start-1 sm:w-auto sm:items-end"
			>
				<div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:justify-end">
					<TimeframeToggle timeframes={METRICS_TIMEFRAMES} value={METRICS_TIMEFRAMES[2]} onValueChange={() => {}} />
				</div>
			</div>
			<div className="h-72 animate-pulse rounded-lg bg-muted sm:col-span-2 sm:row-start-2 sm:h-96" />
		</>
	);
}

export function HomeActivityTabs({ initialData }: { initialData: HomeActivityData }) {
	const [tab, setTab] = useState<HomeActivityTab>(initialData.kind);
	const [data, setData] = useState<HomeActivityData>(initialData);
	const [isPending, startTransition] = useTransition();
	const requestIdRef = useRef(0);

	const loadTab = useCallback(async (nextTab: HomeActivityTab) => {
		const prevTab = tab;
		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;
		try {
			const result = await getHomeActivityDataAction(nextTab);
			if (requestIdRef.current === requestId) setData(result);
		} catch (error) {
			if (requestIdRef.current !== requestId) return;
			setTab(prevTab);
			console.error("Failed to load home activity data", error);
		}
	}, [tab]);

	const refresh = useCallback(() => loadTab(tab), [loadTab, tab]);

	return (
		<Tabs
			value={tab}
			onValueChange={(value) => {
				const next = value as HomeActivityTab;
				if (next === tab) return;
				posthog.capture("home_activity_tab_changed", { tab: next, previous_tab: tab });
				setTab(next);
				startTransition(() => loadTab(next));
			}}
			className="gap-3"
			aria-busy={isPending}
		>
			<div className="grid gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
				<div className="min-w-0">
					<HomeTabsBar pending={isPending} />
				</div>
				<div className="contents transition-opacity data-[pending]:opacity-70" data-pending={isPending ? "" : undefined}>
					{isPending || data.kind !== tab ? (
						<HomeActivityFallback />
					) : (
						<HomeActivityContent data={data} onRefresh={refresh} />
					)}
				</div>
			</div>
		</Tabs>
	);
}
