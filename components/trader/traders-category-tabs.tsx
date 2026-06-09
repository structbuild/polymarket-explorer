"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PolymarketCategory } from "@structbuild/sdk";
import { useCallback, useTransition } from "react";
import posthog from "posthog-js";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POLYMARKET_CATEGORIES } from "@/lib/tag-category";
import { cn } from "@/lib/utils";

const GLOBAL_VALUE = "global" as const;
type TabValue = typeof GLOBAL_VALUE | PolymarketCategory;

type TradersCategoryTabsProps = {
	category: PolymarketCategory | null;
};

export function TradersCategoryTabs({ category }: TradersCategoryTabsProps) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const currentTab: TabValue = category ?? GLOBAL_VALUE;

	const setTab = useCallback(
		(next: TabValue) => {
			if (next === currentTab) return;

			posthog.capture("traders_category_tab_changed", {
				category: next,
				previous_category: currentTab,
			});

			const params = new URLSearchParams(searchParams.toString());
			if (next === GLOBAL_VALUE) {
				params.delete("category");
			} else {
				params.set("category", next);
			}
			params.delete("cursor");
			params.delete("page");

			const search = params.toString();
			const href = (search ? `${pathname}?${search}` : pathname) as Route;
			startTransition(() => {
				router.push(href, { scroll: false });
			});
		},
		[currentTab, pathname, router, searchParams],
	);

	return (
		<Tabs value={currentTab} onValueChange={(value) => setTab(value as TabValue)}>
			<TabsList
				variant="text"
				aria-busy={isPending}
				className={cn(
					"flex w-full justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					isPending && "opacity-70",
				)}
			>
				<TabsTrigger className="text-base! sm:text-xl!" value={GLOBAL_VALUE}>
					Global
				</TabsTrigger>
				{POLYMARKET_CATEGORIES.map((value) => (
					<TabsTrigger key={value} className="text-base! sm:text-xl!" value={value}>
						{value}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}
