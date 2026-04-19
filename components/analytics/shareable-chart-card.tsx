"use client"

import { useCallback, useRef, useState, type ReactNode } from "react"

import { ShareImageDialog } from "@/components/ui/share-image-dialog"
import { ChartCard } from "@/components/market/chart-card"
import { ShareModeContext } from "@/lib/hooks/use-share-mode"

const SHARE_CARD_WIDTH = 1200
const SHARE_CARD_HEIGHT = 675

type ShareableChartCardProps = {
	title: string
	filename: string
	children: ReactNode
	footer?: ReactNode
}

function waitForChartLayout(): Promise<void> {
	return new Promise((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				window.setTimeout(resolve, 80)
			})
		})
	})
}

export function ShareableChartCard({
	title,
	filename,
	children,
	footer,
}: ShareableChartCardProps) {
	const mirrorRef = useRef<HTMLDivElement>(null)
	const [mirrorMounted, setMirrorMounted] = useState(false)

	const handleBeforeCapture = useCallback(async () => {
		setMirrorMounted(true)
		await waitForChartLayout()
	}, [])

	const handleAfterCapture = useCallback(() => {
		setMirrorMounted(false)
	}, [])

	return (
		<>
			<ChartCard
				title={title}
				action={
					<ShareImageDialog
						targetRef={mirrorRef}
						filename={filename}
						dialogTitle={`Share ${title}`}
						dialogDescription="Preview the chart card before downloading it or copying it as an image."
						buttonSize="icon-sm"
						buttonVariant="ghost"
						buttonAriaLabel={`Share ${title} chart`}
						iconOnly
						onBeforeCapture={handleBeforeCapture}
						onAfterCapture={handleAfterCapture}
					/>
				}
				footer={footer}
			>
				{children}
			</ChartCard>

			{mirrorMounted ? (
				<ShareModeContext.Provider value={true}>
					<div
						aria-hidden="true"
						className="pointer-events-none fixed left-[-10000px] top-0 overflow-hidden"
					>
						<div
							ref={mirrorRef}
							className="group/share-card"
							data-share-mode="image"
							style={{
								width: `${SHARE_CARD_WIDTH}px`,
								height: `${SHARE_CARD_HEIGHT}px`,
							}}
						>
							<ChartCard title={title} className="rounded-none" footer={footer}>
								{children}
							</ChartCard>
						</div>
					</div>
				</ShareModeContext.Provider>
			) : null}
		</>
	)
}
