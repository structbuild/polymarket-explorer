"use client"

import { useCallback, useTransition } from "react"
import { useQueryStates } from "nuqs"

import { traderSearchParamParsers } from "@/lib/trader-search-params"
import {
	type TraderTab,
} from "@/lib/trader-search-params-shared"
import { cn } from "@/lib/utils"

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"

export function TraderTabs({
	value,
	onValueChange,
	pending = false,
}: {
	value?: TraderTab
	onValueChange?: (value: TraderTab) => void
	pending?: boolean
}) {
	const [isPending, startTransition] = useTransition()
	const [{ tab: uncontrolledTab }, setSearchParams] = useQueryStates(
		{ tab: traderSearchParamParsers.tab },
		{
			history: "push",
			scroll: false,
			shallow: false,
			startTransition,
		},
	)
	const currentTab = value ?? uncontrolledTab

	const setTab = useCallback((nextTab: TraderTab) => {
		if (nextTab === currentTab) {
			return
		}

		if (onValueChange) {
			onValueChange(nextTab)
			return
		}

		void setSearchParams({ tab: nextTab })
	}, [currentTab, onValueChange, setSearchParams])

	return (
		<Tabs value={currentTab} onValueChange={(value) => setTab(value as TraderTab)}>
			<div className="flex items-center gap-5">
				<TabsList
					variant="text"
					aria-busy={isPending || pending}
					className={cn(
						"flex w-full justify-start gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
						(isPending || pending) && "opacity-70",
					)}
				>
					<TabsTrigger
						className="text-base! sm:text-xl!"
						value="active"
					>
						Open
					</TabsTrigger>
					<TabsTrigger
						className="text-base! sm:text-xl!"
						value="closed"
					>
						Closed
					</TabsTrigger>
					<TabsTrigger
						className="text-base! sm:text-xl!"
						value="activity"
					>
						Activity
					</TabsTrigger>
				</TabsList>
			</div>
		</Tabs>
	)
}
