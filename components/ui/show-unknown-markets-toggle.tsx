"use client"

import { EyeIcon, EyeOffIcon } from "lucide-react"

import { Button } from "./button"
import { TooltipWrapper } from "./tooltip"

type Props = {
	show: boolean
	onToggle: (next: boolean) => void
}

export function ShowUnknownMarketsToggle({ show, onToggle }: Props) {
	return (
		<TooltipWrapper content="These markets are no longer indexed by the Polymarket Gamma API, so we have no information on them.">
			<Button variant="outline" size="sm" onClick={() => onToggle(!show)}>
				{show ? <EyeOffIcon data-icon="inline-start" /> : <EyeIcon data-icon="inline-start" />}
				{show ? "Hide Unknown Markets" : "Show Unknown Markets"}
			</Button>
		</TooltipWrapper>
	)
}
