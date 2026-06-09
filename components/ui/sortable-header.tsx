"use client"

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import posthog from "posthog-js"

import { InfoTooltip } from "@/components/ui/info-tooltip"
import { TooltipWrapper } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type SortableHeaderProps<T extends string> = {
	children: React.ReactNode
	sortBy: T
	currentSortBy: T
	currentSortDirection: "asc" | "desc"
	onSortChange: (sortBy: T) => void
	tooltip?: string
	label?: string
	table?: string
}

export function SortableHeader<T extends string>({
	children,
	sortBy,
	currentSortBy,
	currentSortDirection,
	onSortChange,
	tooltip,
	label,
	table,
}: SortableHeaderProps<T>) {
	const isActive = currentSortBy === sortBy
	const SortIcon = isActive
		? currentSortDirection === "asc"
			? ArrowUpIcon
			: ArrowDownIcon
		: ArrowUpDownIcon

	const resolvedLabel = label ?? (typeof children === "string" ? children : "this column")
	const hoverTooltip = isActive
		? currentSortDirection === "desc"
			? "Sorted high → low. Click to reverse."
			: "Sorted low → high. Click to reverse."
		: `Sort by ${resolvedLabel}`

	return (
		<span className="inline-flex items-center gap-1.5">
			<TooltipWrapper content={hoverTooltip}>
				<button
					type="button"
					className={cn(
						"inline-flex items-center gap-1.5 text-left transition-colors hover:text-foreground",
						isActive && "text-foreground",
					)}
					onClick={() => {
						const nextDirection = isActive
							? currentSortDirection === "asc"
								? "desc"
								: "asc"
							: currentSortDirection
						posthog.capture("table_sorted", {
							table,
							column: sortBy,
							direction: nextDirection,
							previous_column: currentSortBy,
						})
						onSortChange(sortBy)
					}}
				>
					<span>{children}</span>
					<SortIcon className="size-4" />
				</button>
			</TooltipWrapper>
			{tooltip ? <InfoTooltip content={tooltip} className="align-middle" /> : null}
		</span>
	)
}
