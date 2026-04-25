"use client"

import type { RefObject } from "react"

import { ShareImageDialog } from "@/components/ui/share-image-dialog"
import { buildTraderShareFilename } from "@/lib/share-image"

type PnlShareDialogProps = {
	address: string
	displayName: string
	targetRef: RefObject<HTMLElement | null>
}

export function PnlShareDialog({ address, displayName, targetRef }: PnlShareDialogProps) {
	return (
		<ShareImageDialog
			targetRef={targetRef}
			filename={buildTraderShareFilename({ displayName, address, suffix: "pnl-card" })}
			dialogTitle="Share PnL Card"
			dialogDescription="Preview the chart card before downloading it or copying it as an image."
			buttonVariant="default"
			buttonClassName="opacity-100"
		/>
	)
}
