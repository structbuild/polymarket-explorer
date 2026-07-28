"use client"
/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, ReactNode } from "react"

import { useImageTone } from "@/lib/hooks/use-image-tone"
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url"
import { resolveImageTonePresentation } from "@/lib/image-tone"
import { cn } from "@/lib/utils"

const PLATE_CLASS = {
	light: "bg-white",
	dark: "bg-neutral-900",
} as const

const ADJUST_CLASS = {
	lighten: "[filter:brightness(1.45)_contrast(1.05)]",
	dim: "[filter:brightness(0.9)] dark:[filter:none]",
} as const

export function AdaptiveImage({
	src,
	alt = "",
	className,
	imageClassName,
	plateClassName = "bg-card",
	style,
	fallback,
}: {
	src?: string | null
	alt?: string
	className?: string
	imageClassName?: string
	plateClassName?: string
	style?: CSSProperties
	fallback?: ReactNode
}) {
	const resolved = src ? normalizePolymarketS3ImageUrl(src) : null
	const tone = useImageTone(resolved)
	const { plate, adjust } = resolveImageTonePresentation(tone)

	return (
		<span
			className={cn("block overflow-hidden", plate ? PLATE_CLASS[plate] : plateClassName, className)}
			style={style}
		>
			{resolved ? (
				<img
					src={resolved}
					alt={alt}
					className={cn("size-full object-cover", adjust ? ADJUST_CLASS[adjust] : null, imageClassName)}
				/>
			) : (
				fallback
			)}
		</span>
	)
}
