"use client"

import type { RefObject } from "react"

import { ShareImageDialog } from "@/components/ui/share-image-dialog"

type PnlShareDialogProps = {
	address: string
	displayName: string
	targetRef: RefObject<HTMLElement | null>
}

function buildShareFilename(displayName: string, address: string) {
	const baseName = (displayName || address).trim().toLowerCase()
	const slug = baseName
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")

	return `${slug || address.toLowerCase()}-pnl-card.png`
}

export function PnlShareDialog({ address, displayName, targetRef }: PnlShareDialogProps) {
	return (
		<ShareImageDialog
			targetRef={targetRef}
			filename={buildShareFilename(displayName, address)}
			dialogTitle="Share PnL Card"
			dialogDescription="Preview the chart card before downloading it or copying it as an image."
		/>
	)
}
