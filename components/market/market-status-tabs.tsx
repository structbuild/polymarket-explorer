"use client";

import type { Route } from "next";
import { useCallback, useEffect, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

import {
	DEFAULT_MARKET_STATUS_TAB,
	marketStatusTabValues,
	type MarketStatusTab,
} from "@/lib/market-search-params-shared";
import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const prefetchedTabHrefs = new Set<string>();

const backgroundPrefetchDelayMs = 250;
const idlePrefetchTimeoutMs = 2_000;

type NavigatorWithConnection = Navigator & {
	connection?: {
		saveData?: boolean;
		effectiveType?: string;
	};
};

function canBackgroundPrefetch() {
	if (typeof navigator === "undefined") {
		return false;
	}

	const connection = (navigator as NavigatorWithConnection).connection;

	if (connection?.saveData) {
		return false;
	}

	return (
		connection?.effectiveType !== "slow-2g" &&
		connection?.effectiveType !== "2g"
	);
}

function buildTabHref(pathname: string, search: string, tab: MarketStatusTab) {
	const params = new URLSearchParams(search);

	if (tab === DEFAULT_MARKET_STATUS_TAB) {
		params.delete("tab");
	} else {
		params.set("tab", tab);
	}

	params.delete("cursor");
	params.delete("page");

	const nextSearch = params.toString();
	return (nextSearch ? `${pathname}?${nextSearch}` : pathname) as Route;
}

function readCurrentTab(value: string | null): MarketStatusTab {
	return marketStatusTabValues.includes(value as MarketStatusTab)
		? (value as MarketStatusTab)
		: DEFAULT_MARKET_STATUS_TAB;
}

function scheduleWhenIdle(callback: () => void) {
	if (typeof window.requestIdleCallback === "function") {
		const idleId = window.requestIdleCallback(callback, {
			timeout: idlePrefetchTimeoutMs,
		});

		return () => window.cancelIdleCallback(idleId);
	}

	const timeoutId = window.setTimeout(callback, backgroundPrefetchDelayMs);
	return () => window.clearTimeout(timeoutId);
}

const tabLabels: Record<MarketStatusTab, string> = {
	open: "Open",
	closed: "Closed",
};

export function MarketStatusTabs({
	value,
	onValueChange,
	pending = false,
	prefetchEnabled = true,
}: {
	value?: MarketStatusTab;
	onValueChange?: (value: MarketStatusTab) => void;
	pending?: boolean;
	prefetchEnabled?: boolean;
}) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentTab = value ?? readCurrentTab(searchParams.get("tab"));
	const search = searchParams.toString();

	const setTab = useCallback((nextTab: MarketStatusTab) => {
		if (nextTab === currentTab) {
			return;
		}

		posthog.capture("market_status_tab_changed", { tab: nextTab, previous_tab: currentTab });
		if (onValueChange) {
			onValueChange(nextTab);
			return;
		}

		const href = buildTabHref(pathname, search, nextTab);
		startTransition(() => {
			router.push(href, { scroll: false });
		});
	}, [currentTab, onValueChange, pathname, router, search]);

	const prefetchTab = useCallback((nextTab: MarketStatusTab) => {
		if (!prefetchEnabled || nextTab === currentTab) {
			return;
		}

		const href = buildTabHref(pathname, search, nextTab);

		if (!prefetchedTabHrefs.has(href)) {
			prefetchedTabHrefs.add(href);
			router.prefetch(href);
		}
	}, [currentTab, pathname, prefetchEnabled, router, search]);

	useEffect(() => {
		if (!prefetchEnabled || isPending || pending || !canBackgroundPrefetch()) {
			return;
		}

		const nextTabs = marketStatusTabValues.filter((tab) => tab !== currentTab);
		const timeoutIds: number[] = [];
		let cancelIdleWork = () => {};

		const startPrefetch = () => {
			cancelIdleWork = scheduleWhenIdle(() => {
				nextTabs.forEach((tab, index) => {
					const timeoutId = window.setTimeout(() => {
						prefetchTab(tab);
					}, index * backgroundPrefetchDelayMs);

					timeoutIds.push(timeoutId);
				});
			});
		};

		if (document.readyState === "complete") {
			startPrefetch();
		} else {
			window.addEventListener("load", startPrefetch, { once: true });
		}

		return () => {
			cancelIdleWork();

			timeoutIds.forEach((timeoutId) => {
				window.clearTimeout(timeoutId);
			});

			window.removeEventListener("load", startPrefetch);
		};
	}, [currentTab, isPending, pending, prefetchEnabled, prefetchTab]);

	return (
		<Tabs value={currentTab} onValueChange={(value) => setTab(value as MarketStatusTab)}>
			<TabsList
				variant="text"
				aria-busy={isPending || pending}
				className={cn(
					"flex w-full justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					(isPending || pending) && "opacity-70",
				)}
			>
				{marketStatusTabValues.map((tab) => (
					<TabsTrigger
						key={tab}
						className="text-base! sm:text-xl!"
						value={tab}
						onMouseEnter={() => prefetchTab(tab)}
						onFocus={() => prefetchTab(tab)}
					>
						{tabLabels[tab]}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}
