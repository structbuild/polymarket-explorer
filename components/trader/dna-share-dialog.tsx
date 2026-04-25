"use client"

import type { RefObject } from "react"

import { ShareImageDialog } from "@/components/ui/share-image-dialog"
import { buildTraderShareFilename } from "@/lib/share-image"

type DnaShareDialogProps = {
	address: string
	displayName: string
	targetRef: RefObject<HTMLElement | null>
}

export function DnaShareDialog({ address, displayName, targetRef }: DnaShareDialogProps) {
	return (
		<ShareImageDialog
			targetRef={targetRef}
			filename={buildTraderShareFilename({ displayName, address, suffix: "trader-dna" })}
			dialogTitle="Share Trader DNA"
			dialogDescription="Preview the Trader DNA card before downloading it or copying it as an image."
			buttonSize="icon-sm"
			buttonVariant="ghost"
			buttonAriaLabel="Share Trader DNA"
			iconOnly
			dialogClassName="sm:max-w-md"
		/>
	)
}
