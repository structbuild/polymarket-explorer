"use client"

import type { Route } from "next"
import { useCallback, useEffect, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQueryStates } from "nuqs"

import { traderSearchParamParsers } from "@/lib/trader-search-params"
import {
	traderTabValues,
	type TraderTab,
} from "@/lib/trader-search-params-shared"
import { cn } from "@/lib/utils"

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"

const prefetchedTabHrefs = new Set<string>()

const backgroundPrefetchDelayMs = 250
const idlePrefetchTimeoutMs = 2_000

type NavigatorWithConnection = Navigator & {
	connection?: {
		saveData?: boolean
		effectiveType?: string
	}
}

function canBackgroundPrefetch() {
	if (typeof navigator === "undefined") {
		return false
	}

	const connection = (navigator as NavigatorWithConnection).connection

	if (connection?.saveData) {
		return false
	}

	return (
		connection?.effectiveType !== "slow-2g" &&
		connection?.effectiveType !== "2g"
	)
}

function buildTabHref(pathname: string, search: string, tab: TraderTab) {
	const params = new URLSearchParams(search)

	if (tab === "active") {
		params.delete("tab")
	} else {
		params.set("tab", tab)
	}

	const nextSearch = params.toString()
	return (nextSearch ? `${pathname}?${nextSearch}` : pathname) as Route
}

function scheduleWhenIdle(callback: () => void) {
	if (typeof window.requestIdleCallback === "function") {
		const idleId = window.requestIdleCallback(callback, {
			timeout: idlePrefetchTimeoutMs,
		})

		return () => window.cancelIdleCallback(idleId)
	}

	const timeoutId = window.setTimeout(callback, backgroundPrefetchDelayMs)
	return () => window.clearTimeout(timeoutId)
}

export function TraderTabs({
	prefetchEnabled = true,
}: {
	prefetchEnabled?: boolean
}) {
	const [isPending, startTransition] = useTransition()
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [{ tab: currentTab }, setSearchParams] = useQueryStates(
		{ tab: traderSearchParamParsers.tab },
		{
			history: "push",
			scroll: false,
			shallow: false,
			startTransition,
		},
	)
	const search = searchParams.toString()

	const setTab = useCallback((nextTab: TraderTab) => {
		if (nextTab === currentTab) {
			return
		}

		void setSearchParams({ tab: nextTab })
	}, [currentTab, setSearchParams])

	const prefetchTab = useCallback((nextTab: TraderTab) => {
		if (!prefetchEnabled || nextTab === currentTab) {
			return
		}

		const href = buildTabHref(pathname, search, nextTab)

		if (!prefetchedTabHrefs.has(href)) {
			prefetchedTabHrefs.add(href)
			router.prefetch(href)
		}
	}, [currentTab, pathname, prefetchEnabled, router, search])

	useEffect(() => {
		if (!prefetchEnabled || isPending || !canBackgroundPrefetch()) {
			return
		}

		const nextTabs = traderTabValues.filter((tab) => tab !== currentTab)
		const timeoutIds: number[] = []
		let cancelIdleWork = () => {}

		const startPrefetch = () => {
			cancelIdleWork = scheduleWhenIdle(() => {
				nextTabs.forEach((tab, index) => {
					const timeoutId = window.setTimeout(() => {
						prefetchTab(tab)
					}, index * backgroundPrefetchDelayMs)

					timeoutIds.push(timeoutId)
				})
			})
		}

		if (document.readyState === "complete") {
			startPrefetch()
		} else {
			window.addEventListener("load", startPrefetch, { once: true })
		}

		return () => {
			cancelIdleWork()

			timeoutIds.forEach((timeoutId) => {
				window.clearTimeout(timeoutId)
			})

			window.removeEventListener("load", startPrefetch)
		}
	}, [currentTab, isPending, prefetchEnabled, prefetchTab])

	return (
		<Tabs value={currentTab} onValueChange={(value) => setTab(value as TraderTab)}>
			<div className="flex items-center gap-5">
				<TabsList
					variant="text"
					aria-busy={isPending}
					className={cn(
						"flex w-full justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
						isPending && "opacity-70",
					)}
				>
					<TabsTrigger
						className="text-base! sm:text-xl!"
						value="active"
						onMouseEnter={() => prefetchTab("active")}
						onFocus={() => prefetchTab("active")}
					>
						Open
					</TabsTrigger>
					<TabsTrigger
						className="text-base! sm:text-xl!"
						value="closed"
						onMouseEnter={() => prefetchTab("closed")}
						onFocus={() => prefetchTab("closed")}
					>
						Closed
					</TabsTrigger>
					<TabsTrigger
						className="text-base! sm:text-xl!"
						value="activity"
						onMouseEnter={() => prefetchTab("activity")}
						onFocus={() => prefetchTab("activity")}
					>
						Activity
					</TabsTrigger>
				</TabsList>
			</div>
		</Tabs>
	)
}
