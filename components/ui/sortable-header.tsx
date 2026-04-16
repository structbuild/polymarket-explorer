"use client"

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type SortableHeaderProps<T extends string> = {
	children: React.ReactNode
	sortBy: T
	currentSortBy: T
	currentSortDirection: "asc" | "desc"
	onSortChange: (sortBy: T) => void
}

export function SortableHeader<T extends string>({
	children,
	sortBy,
	currentSortBy,
	currentSortDirection,
	onSortChange,
}: SortableHeaderProps<T>) {
	const isActive = currentSortBy === sortBy
	const SortIcon = isActive
		? currentSortDirection === "asc"
			? ArrowUpIcon
			: ArrowDownIcon
		: ArrowUpDownIcon

	return (
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
	)
}
