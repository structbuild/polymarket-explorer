"use client";

import type { Route } from "next";
import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

import {
	DEFAULT_EVENT_STATUS_TAB,
	eventStatusTabValues,
	type EventStatusTab,
} from "@/lib/event-search-params-shared";
import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

function buildTabHref(pathname: string, search: string, tab: EventStatusTab) {
	const params = new URLSearchParams(search);

	if (tab === DEFAULT_EVENT_STATUS_TAB) {
		params.delete("tab");
	} else {
		params.set("tab", tab);
	}

	params.delete("cursor");
	params.delete("page");

	const nextSearch = params.toString();
	return (nextSearch ? `${pathname}?${nextSearch}` : pathname) as Route;
}

function readCurrentTab(value: string | null): EventStatusTab {
	return eventStatusTabValues.includes(value as EventStatusTab)
		? (value as EventStatusTab)
		: DEFAULT_EVENT_STATUS_TAB;
}

const tabLabels: Record<EventStatusTab, string> = {
	open: "Open",
	closed: "Closed",
};

export function EventStatusTabs({
	value,
	onValueChange,
	pending = false,
}: {
	value?: EventStatusTab;
	onValueChange?: (value: EventStatusTab) => void;
	pending?: boolean;
}) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentTab = value ?? readCurrentTab(searchParams.get("tab"));
	const search = searchParams.toString();

	const setTab = useCallback((nextTab: EventStatusTab) => {
		if (nextTab === currentTab) {
			return;
		}

		posthog.capture("event_status_tab_changed", { tab: nextTab, previous_tab: currentTab });
		if (onValueChange) {
			onValueChange(nextTab);
			return;
		}

		const href = buildTabHref(pathname, search, nextTab);
		startTransition(() => {
			router.push(href, { scroll: false });
		});
	}, [currentTab, onValueChange, pathname, router, search]);

	return (
		<Tabs value={currentTab} onValueChange={(value) => setTab(value as EventStatusTab)}>
			<TabsList
				variant="text"
				aria-busy={isPending || pending}
				className={cn(
					"flex w-full justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					(isPending || pending) && "opacity-70",
				)}
			>
				{eventStatusTabValues.map((tab) => (
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
