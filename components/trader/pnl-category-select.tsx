"use client"

import type { PolymarketCategory } from "@structbuild/sdk"
import posthog from "posthog-js"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ALL_VALUE = "all"

type PnlCategorySelectProps = {
	value: PolymarketCategory | null
	categories: PolymarketCategory[]
	disabled?: boolean
	onChange: (category: PolymarketCategory | null) => void
}

export function PnlCategorySelect({ value, categories, disabled = false, onChange }: PnlCategorySelectProps) {
	function handleChange(next: string | null) {
		if (!next) return
		const category = next === ALL_VALUE ? null : (next as PolymarketCategory)
		if (category === value) return
		posthog.capture("trader_pnl_category_selected", { category: category ?? ALL_VALUE })
		onChange(category)
	}

	return (
		<Select value={value ?? ALL_VALUE} onValueChange={handleChange} disabled={disabled}>
			<SelectTrigger size="sm" className="rounded-lg!" aria-label="PnL category">
				<SelectValue>{(selected) => (selected === ALL_VALUE ? "All" : (selected as string))}</SelectValue>
			</SelectTrigger>
			<SelectContent className="max-h-72">
				<SelectItem value={ALL_VALUE}>All categories</SelectItem>
				{categories.map((category) => (
					<SelectItem key={category} value={category}>
						{category}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
