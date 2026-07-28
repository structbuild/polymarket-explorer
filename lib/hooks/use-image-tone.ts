"use client"

import { useCallback, useSyncExternalStore } from "react"

import { getImageToneSnapshot, subscribeImageTone, type ImageTone } from "@/lib/image-tone"

const NO_TONE = () => null
const NO_SUBSCRIPTION = () => () => {}

export function useImageTone(src: string | null | undefined): ImageTone | null {
	const subscribe = useCallback(
		(onChange: () => void) => (src ? subscribeImageTone(src, onChange) : NO_SUBSCRIPTION()),
		[src],
	)
	const getSnapshot = useCallback(() => (src ? getImageToneSnapshot(src) : null), [src])

	return useSyncExternalStore(subscribe, getSnapshot, NO_TONE)
}
