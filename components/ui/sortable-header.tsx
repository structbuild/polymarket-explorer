"use client"

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

import { InfoTooltip } from "@/components/ui/info-tooltip"
import { cn } from "@/lib/utils"

type SortableHeaderProps<T extends string> = {
	children: React.ReactNode
	sortBy: T
	currentSortBy: T
	currentSortDirection: "asc" | "desc"
	onSortChange: (sortBy: T) => void
	tooltip?: string
}

export function SortableHeader<T extends string>({
	children,
	sortBy,
	currentSortBy,
	currentSortDirection,
	onSortChange,
	tooltip,
}: SortableHeaderProps<T>) {
	const isActive = currentSortBy === sortBy
	const SortIcon = isActive
		? currentSortDirection === "asc"
			? ArrowUpIcon
			: ArrowDownIcon
		: ArrowUpDownIcon

	return (
		<span className="inline-flex items-center gap-1.5">
			<button
				type="button"
				className={cn(
					"inline-flex items-center gap-1.5 text-left transition-colors hover:text-foreground",
					isActive && "text-foreground",
				)}
				onClick={() => onSortChange(sortBy)}
			>
				<span>{children}</span>
				<SortIcon className="size-4" />
			</button>
			{tooltip ? <InfoTooltip content={tooltip} className="align-middle" /> : null}
		</span>
	)
}
