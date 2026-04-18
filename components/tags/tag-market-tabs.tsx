"use client";

import type { Route } from "next";
import { useCallback, useEffect, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
	DEFAULT_TAG_MARKET_TAB,
	tagMarketTabValues,
	type TagMarketTab,
} from "@/lib/struct/tag-shared";
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

function buildTabHref(pathname: string, search: string, tab: TagMarketTab) {
	const params = new URLSearchParams(search);

	if (tab === DEFAULT_TAG_MARKET_TAB) {
		params.delete("tab");
	} else {
		params.set("tab", tab);
	}

	params.delete("cursor");
	params.delete("page");

	const nextSearch = params.toString();
	return (nextSearch ? `${pathname}?${nextSearch}` : pathname) as Route;
}

function readCurrentTab(value: string | null): TagMarketTab {
	return tagMarketTabValues.includes(value as TagMarketTab)
		? (value as TagMarketTab)
		: DEFAULT_TAG_MARKET_TAB;
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

const tabLabels: Record<TagMarketTab, string> = {
	open: "Open",
	closed: "Closed",
};

export function TagMarketTabs({
	prefetchEnabled = true,
}: {
	prefetchEnabled?: boolean;
}) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentTab = readCurrentTab(searchParams.get("tab"));
	const search = searchParams.toString();

	const setTab = useCallback((nextTab: TagMarketTab) => {
		if (nextTab === currentTab) {
			return;
		}

		const href = buildTabHref(pathname, search, nextTab);
		startTransition(() => {
			router.push(href, { scroll: false });
		});
	}, [currentTab, pathname, router, search]);

	const prefetchTab = useCallback((nextTab: TagMarketTab) => {
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
		if (!prefetchEnabled || isPending || !canBackgroundPrefetch()) {
			return;
		}

		const nextTabs = tagMarketTabValues.filter((tab) => tab !== currentTab);
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
	}, [currentTab, isPending, prefetchEnabled, prefetchTab]);

	return (
		<Tabs value={currentTab} onValueChange={(value) => setTab(value as TagMarketTab)}>
			<TabsList
				variant="text"
				aria-busy={isPending}
				className={cn(
					"flex w-full justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					isPending && "opacity-70",
				)}
			>
				{tagMarketTabValues.map((tab) => (
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
