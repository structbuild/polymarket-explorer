"use client"

import Image from "next/image"
import { useEffect, useRef, useState, startTransition, type RefObject } from "react"
import { CheckIcon, CopyIcon, DownloadIcon, LoaderCircleIcon, Share2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { captureElementAsPng } from "@/lib/share-image"

type ButtonResult =
	| { tone: "success"; message: string }
	| { tone: "error"; message: string }
	| null

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

function downloadBlob(blob: Blob, filename: string) {
	const downloadUrl = URL.createObjectURL(blob)
	const anchor = document.createElement("a")

	anchor.href = downloadUrl
	anchor.download = filename
	anchor.click()

	window.setTimeout(() => {
		URL.revokeObjectURL(downloadUrl)
	}, 0)
}

export function PnlShareDialog({ address, displayName, targetRef }: PnlShareDialogProps) {
	const [open, setOpen] = useState(false)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [imageBlob, setImageBlob] = useState<Blob | null>(null)
	const [isGenerating, setIsGenerating] = useState(false)
	const [isDownloading, setIsDownloading] = useState(false)
	const [isCopying, setIsCopying] = useState(false)
	const [downloadResult, setDownloadResult] = useState<ButtonResult>(null)
	const [copyResult, setCopyResult] = useState<ButtonResult>(null)

	const previewUrlRef = useRef<string | null>(null)
	const pendingCaptureRef = useRef<Promise<Blob> | null>(null)

	useEffect(() => {
		return () => {
			const previewUrl = previewUrlRef.current

			if (previewUrl) {
				URL.revokeObjectURL(previewUrl)
			}
		}
	}, [])

	useEffect(() => {
		if (downloadResult?.tone !== "success") {
			return
		}

		const timer = setTimeout(() => setDownloadResult(null), 2000)
		return () => clearTimeout(timer)
	}, [downloadResult])

	useEffect(() => {
		if (copyResult?.tone !== "success") {
			return
		}

		const timer = setTimeout(() => setCopyResult(null), 2000)
		return () => clearTimeout(timer)
	}, [copyResult])

	async function ensureImage(forceRefresh: boolean = false) {
		if (!forceRefresh && imageBlob) {
			return imageBlob
		}

		if (pendingCaptureRef.current) {
			return pendingCaptureRef.current
		}

		const target = targetRef.current

		if (!target) {
			throw new Error("The PnL card is not available to capture right now.")
		}

		setIsGenerating(true)

		const nextCapture = captureElementAsPng(target)
			.then((blob) => {
				const nextPreviewUrl = URL.createObjectURL(blob)
				const previousUrl = previewUrlRef.current

				previewUrlRef.current = nextPreviewUrl
				if (previousUrl) {
					URL.revokeObjectURL(previousUrl)
				}

				startTransition(() => {
					setPreviewUrl(nextPreviewUrl)
					setImageBlob(blob)
				})

				return blob
			})
			.catch((error) => {
				throw error instanceof Error ? error : new Error("Failed to generate the share image.")
			})
			.finally(() => {
				pendingCaptureRef.current = null
				setIsGenerating(false)
			})

		pendingCaptureRef.current = nextCapture
		return nextCapture
	}

	function setResultWithAutoReset(
		setter: typeof setDownloadResult | typeof setCopyResult,
		result: ButtonResult,
	) {
		setter(result)
	}

	async function handleDownload() {
		try {
			setIsDownloading(true)
			setDownloadResult(null)
			const blob = await ensureImage()
			downloadBlob(blob, buildShareFilename(displayName, address))
			setResultWithAutoReset(setDownloadResult, { tone: "success", message: "Downloaded!" })
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unable to download the PNG right now."
			setResultWithAutoReset(setDownloadResult, { tone: "error", message })
		} finally {
			setIsDownloading(false)
		}
	}

	async function handleCopy() {
		if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
			setResultWithAutoReset(setCopyResult, {
				tone: "error",
				message: "Clipboard image copy is not supported in this browser.",
			})
			return
		}

		try {
			setIsCopying(true)
			setCopyResult(null)
			const blob = await ensureImage()
			await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
			setResultWithAutoReset(setCopyResult, { tone: "success", message: "Copied!" })
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unable to copy the image to the clipboard right now."
			setResultWithAutoReset(setCopyResult, { tone: "error", message })
		} finally {
			setIsCopying(false)
		}
	}

	const isBusy = isGenerating || isDownloading || isCopying

	async function handleOpenDialog() {
		if (isBusy) {
			return
		}

		setDownloadResult(null)
		setCopyResult(null)

		try {
			await ensureImage(true)
			setOpen(true)
		} catch {
			// Keep the dialog closed if preview generation fails.
		}
	}

	return (
		<>
			<Button
				disabled={isBusy}
				onClick={() => {
					void handleOpenDialog()
				}}
				size="sm"
				variant="secondary"
			>
				{isGenerating ? <LoaderCircleIcon className="animate-spin" /> : <Share2Icon />}
				{isGenerating ? "Preparing..." : "Share"}
			</Button>

			<Dialog
				open={open}
				onOpenChange={(nextOpen) => {
					setOpen(nextOpen)
					if (!nextOpen) {
						setDownloadResult(null)
						setCopyResult(null)
					}
				}}
			>
				<DialogContent className="max-h-[calc(100vh-1.5rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
					<DialogHeader className="hidden">
						<DialogTitle>Share PnL Card</DialogTitle>
						<DialogDescription>Preview the chart card before downloading it or copying it as an image.</DialogDescription>
					</DialogHeader>

					<div className="overflow-y-auto">
						<div className="overflow-hidden rounded-xl rounded-b-none border border-border/70 bg-card shadow-sm">
							{previewUrl ? (
								<Image
									alt="Preview of the PnL share image"
									className="block h-auto w-full"
									height={900}
									src={previewUrl}
									unoptimized
									width={1600}
								/>
							) : (
								<div className="flex aspect-4/3 min-h-64 items-center justify-center bg-muted/40 px-6 text-center text-sm text-muted-foreground">
									{isGenerating ? (
										<span className="inline-flex items-center gap-2">
											<LoaderCircleIcon className="size-4 animate-spin" />
											Generating preview...
										</span>
									) : (
										"Preview unavailable."
									)}
								</div>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-2 border-t bg-muted/50 px-4 py-4 sm:flex-row sm:items-end sm:justify-end sm:gap-3 sm:px-6">
						<div className="flex flex-col gap-1">
							<Button disabled={isBusy} onClick={handleCopy} size="sm" variant="outline">
								{isCopying ? (
									<LoaderCircleIcon className="animate-spin" />
								) : copyResult?.tone === "success" ? (
									<CheckIcon className="text-emerald-500" />
								) : copyResult?.tone === "error" ? (
									<XIcon className="text-red-500" />
								) : (
									<CopyIcon />
								)}
								Copy image
							</Button>
							{copyResult?.tone === "error" && (
								<p className="max-w-64 text-xs text-red-500">{copyResult.message}</p>
							)}
						</div>
						<div className="flex flex-col gap-1">
							<Button disabled={isBusy} onClick={handleDownload} size="sm">
								{isDownloading ? (
									<LoaderCircleIcon className="animate-spin" />
								) : downloadResult?.tone === "success" ? (
									<CheckIcon />
								) : downloadResult?.tone === "error" ? (
									<XIcon />
								) : (
									<DownloadIcon />
								)}
								Download PNG
							</Button>
							{downloadResult?.tone === "error" && (
								<p className="max-w-64 text-xs text-red-500">{downloadResult.message}</p>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
