"use client";

import type { Route } from "next";
import { useCallback, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

import { DEFAULT_TAG_VIEW, tagViewValues, type TagView } from "@/lib/tag-view-shared";
import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const viewLabels: Record<TagView, string> = {
	events: "Events",
	markets: "Markets",
	"top-traders": "Top Traders",
};

function buildViewHref(pathname: string, search: string, view: TagView) {
	const params = new URLSearchParams(search);

	if (view === DEFAULT_TAG_VIEW) {
		params.delete("content");
	} else {
		params.set("content", view);
	}

	params.delete("cursor");
	params.delete("page");
	params.delete("tab");

	const nextSearch = params.toString();
	return (nextSearch ? `${pathname}?${nextSearch}` : pathname) as Route;
}

export function TagViewTabs({
	value,
	availableViews,
	teasers,
}: {
	value: TagView;
	availableViews?: readonly TagView[];
	teasers?: Partial<Record<TagView, ReactNode>>;
}) {
	const visibleViews = availableViews ?? tagViewValues;
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const search = searchParams.toString();

	const setView = useCallback(
		(nextView: TagView) => {
			if (nextView === value) return;
			posthog.capture("tag_view_changed", { view: nextView, previous_view: value });
			const href = buildViewHref(pathname, search, nextView);
			startTransition(() => {
				router.push(href, { scroll: false });
			});
		},
		[pathname, router, search, value],
	);

	return (
		<Tabs value={value} onValueChange={(v) => setView(v as TagView)}>
			<TabsList
				variant="text"
				aria-busy={isPending}
				className={cn(
					"flex w-full justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					isPending && "opacity-70",
				)}
			>
				{visibleViews.map((view) => (
					<TabsTrigger
						key={view}
						className="text-base! sm:text-xl!"
						value={view}
					>
						{viewLabels[view]}
						{teasers?.[view]}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}
