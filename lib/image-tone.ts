export type ImageTone = {
	luminance: number
	alpha: number
	transparent: boolean
	tone: "dark" | "light" | "neutral"
}

export type ImageTonePresentation = {
	plate: "light" | "dark" | null
	adjust: "lighten" | "dim" | null
}

const SAMPLE_SIZE = 24
const DARK_LUMINANCE = 0.34
const LIGHT_LUMINANCE = 0.7
const VERY_DARK_LUMINANCE = 0.22
const VERY_LIGHT_LUMINANCE = 0.9
const OPAQUE_ALPHA = 0.96

const resolvedTones = new Map<string, ImageTone | null>()
const pendingTones = new Map<string, Promise<ImageTone | null>>()
const toneListeners = new Map<string, Set<() => void>>()

function optimizedSampleUrl(src: string): string | null {
	if (src.startsWith("data:") || src.startsWith("blob:")) return null
	return `/_next/image?url=${encodeURIComponent(src)}&w=32&q=75`
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const element = new Image()
		element.crossOrigin = "anonymous"
		element.decoding = "async"
		element.onload = () => resolve(element)
		element.onerror = () => reject(new Error(`Unable to load image: ${url}`))
		element.src = url
	})
}

function sampleImageTone(element: HTMLImageElement): ImageTone | null {
	const canvas = document.createElement("canvas")
	canvas.width = SAMPLE_SIZE
	canvas.height = SAMPLE_SIZE

	const context = canvas.getContext("2d", { willReadFrequently: true })
	if (!context) return null

	try {
		context.drawImage(element, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
		const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

		let luminanceSum = 0
		let alphaSum = 0

		for (let index = 0; index < data.length; index += 4) {
			const alpha = data[index + 3] / 255
			if (alpha === 0) continue
			const luminance = (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255
			luminanceSum += luminance * alpha
			alphaSum += alpha
		}

		if (alphaSum === 0) return null

		const luminance = luminanceSum / alphaSum
		const alpha = alphaSum / (SAMPLE_SIZE * SAMPLE_SIZE)

		return {
			luminance,
			alpha,
			transparent: alpha < OPAQUE_ALPHA,
			tone: luminance <= DARK_LUMINANCE ? "dark" : luminance >= LIGHT_LUMINANCE ? "light" : "neutral",
		}
	} catch {
		return null
	}
}

export function getImageToneSnapshot(src: string): ImageTone | null {
	return resolvedTones.get(src) ?? null
}

export function subscribeImageTone(src: string, listener: () => void): () => void {
	let listeners = toneListeners.get(src)
	if (!listeners) {
		listeners = new Set()
		toneListeners.set(src, listeners)
	}
	listeners.add(listener)

	if (!resolvedTones.has(src)) {
		void loadImageTone(src)
	}

	return () => {
		listeners.delete(listener)
		if (listeners.size === 0) toneListeners.delete(src)
	}
}

export async function loadImageTone(src: string): Promise<ImageTone | null> {
	const cached = resolvedTones.get(src)
	if (cached !== undefined) return cached

	const pending = pendingTones.get(src)
	if (pending) return pending

	const next = (async () => {
		const candidates = [optimizedSampleUrl(src), src].filter((url): url is string => url != null)

		for (const url of candidates) {
			try {
				const tone = sampleImageTone(await loadImageElement(url))
				if (tone) return tone
			} catch {
				continue
			}
		}

		return null
	})().then((tone) => {
		resolvedTones.set(src, tone)
		pendingTones.delete(src)
		for (const listener of toneListeners.get(src) ?? []) listener()
		return tone
	})

	pendingTones.set(src, next)
	return next
}

export function resolveImageTonePresentation(tone: ImageTone | null | undefined): ImageTonePresentation {
	if (!tone) return { plate: null, adjust: null }

	if (tone.transparent) {
		if (tone.tone === "dark") return { plate: "light", adjust: null }
		if (tone.tone === "light") return { plate: "dark", adjust: null }
		return { plate: null, adjust: null }
	}

	if (tone.luminance <= VERY_DARK_LUMINANCE) return { plate: null, adjust: "lighten" }
	if (tone.luminance >= VERY_LIGHT_LUMINANCE) return { plate: null, adjust: "dim" }

	return { plate: null, adjust: null }
}
