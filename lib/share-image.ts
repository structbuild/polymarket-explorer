"use client"

export function buildTraderShareFilename({
	displayName,
	address,
	suffix,
}: {
	displayName: string
	address: string
	suffix: string
}) {
	const baseName = (displayName || address).trim().toLowerCase()
	const slug = baseName
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")

	return `${slug || address.toLowerCase()}-${suffix}.png`
}

const MIN_PIXEL_RATIO = 2
const SHARE_MODE_ATTRIBUTE = "data-share-mode"
const SHARE_MODE_IMAGE = "image"
const TRANSPARENT_IMAGE_PLACEHOLDER =
	"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="

function resolveBackgroundColor(node: HTMLElement) {
	const nodeBackground = window.getComputedStyle(node).backgroundColor

	if (nodeBackground && nodeBackground !== "rgba(0, 0, 0, 0)" && nodeBackground !== "transparent") {
		return nodeBackground
	}

	const rootBackground = window.getComputedStyle(document.documentElement).backgroundColor
	return rootBackground && rootBackground !== "rgba(0, 0, 0, 0)" ? rootBackground : "#ffffff"
}

function nextFrame() {
	return new Promise<void>((resolve) => {
		window.requestAnimationFrame(() => resolve())
	})
}

function isInlinedImageSource(src: string) {
	return src.startsWith("data:") || src.startsWith("blob:")
}

function readBlobAsDataUrl(blob: Blob) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader()

		reader.onerror = () => reject(reader.error ?? new Error("Failed to read the image fallback."))
		reader.onloadend = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result)
				return
			}
			reject(new Error("Failed to read the image fallback."))
		}
		reader.readAsDataURL(blob)
	})
}

function getImageFallbackLabel(image: HTMLImageElement) {
	const fallback = image
		.closest<HTMLElement>('[data-slot="avatar"]')
		?.querySelector<HTMLElement>('[data-share-avatar-fallback="true"], [data-slot="avatar-fallback"]')
		?.textContent?.trim()

	if (fallback) {
		return fallback.slice(0, 2).toUpperCase()
	}

	const alt = image.alt.trim().replace(/\s+avatar$/i, "")
	return alt ? alt.slice(0, 2).toUpperCase() : ""
}

function replaceWithImageFallback(image: HTMLImageElement) {
	const avatarFallback = image
		.closest<HTMLElement>('[data-slot="avatar"]')
		?.querySelector<HTMLElement>('[data-share-avatar-fallback="true"], [data-slot="avatar-fallback"]')

	image.removeAttribute("srcset")
	image.removeAttribute("sizes")
	image.src = TRANSPARENT_IMAGE_PLACEHOLDER

	if (avatarFallback) {
		image.style.display = "none"
		avatarFallback.hidden = false
		avatarFallback.style.display = "flex"
		avatarFallback.style.visibility = "visible"
		avatarFallback.style.opacity = "1"
		return
	}

	const bounds = image.getBoundingClientRect()
	const imageStyle = window.getComputedStyle(image)
	const fallback = document.createElement("span")

	fallback.textContent = getImageFallbackLabel(image)
	fallback.setAttribute("aria-hidden", "true")
	fallback.style.alignItems = "center"
	fallback.style.backgroundColor = "#f4f4f5"
	fallback.style.borderRadius = imageStyle.borderRadius
	fallback.style.color = "#71717a"
	fallback.style.display = imageStyle.display === "block" ? "flex" : "inline-flex"
	fallback.style.font = imageStyle.font
	fallback.style.fontWeight = "500"
	fallback.style.height = bounds.height ? `${bounds.height}px` : imageStyle.height
	fallback.style.justifyContent = "center"
	fallback.style.lineHeight = "1"
	fallback.style.width = bounds.width ? `${bounds.width}px` : imageStyle.width

	image.replaceWith(fallback)
}

async function inlineImageForCapture(image: HTMLImageElement) {
	const src = image.currentSrc || image.src

	if (!src || isInlinedImageSource(src)) {
		return
	}

	try {
		const response = await fetch(src, { credentials: "omit", mode: "cors" })
		const contentType = response.headers.get("Content-Type")

		if (!response.ok || !contentType?.startsWith("image/")) {
			throw new Error("The image could not be loaded for the share image.")
		}

		const dataUrl = await readBlobAsDataUrl(await response.blob())
		image.removeAttribute("srcset")
		image.removeAttribute("sizes")
		image.src = dataUrl
	} catch {
		replaceWithImageFallback(image)
	}
}

async function prepareImagesForCapture(clone: HTMLElement) {
	const images = Array.from(clone.querySelectorAll("img"))

	if (images.length === 0) {
		return
	}

	await Promise.all(images.map((image) => inlineImageForCapture(image)))
	await nextFrame()
}

async function createCaptureClone(node: HTMLElement, width: number) {
	const mount = document.createElement("div")
	const clone = node.cloneNode(true) as HTMLElement

	mount.setAttribute("aria-hidden", "true")
	mount.style.position = "fixed"
	mount.style.top = "0"
	mount.style.left = "-10000px"
	mount.style.pointerEvents = "none"
	mount.style.zIndex = "-1"

	clone.setAttribute(SHARE_MODE_ATTRIBUTE, SHARE_MODE_IMAGE)
	clone.style.width = `${width}px`
	clone.style.maxWidth = `${width}px`

	for (const el of clone.querySelectorAll<HTMLElement>('[data-share-ignore="true"]')) {
		el.style.display = "none"
	}
	for (const el of clone.querySelectorAll<SVGElement>(".chart-annotation-label-html")) {
		el.style.display = "none"
	}
	for (const el of clone.querySelectorAll<SVGElement>(".chart-annotation-label-svg")) {
		el.style.display = "inline"
	}

	mount.appendChild(clone)
	document.body.appendChild(mount)

	await nextFrame()
	await prepareImagesForCapture(clone)

	return {
		clone,
		cleanup: () => {
			mount.remove()
		},
	}
}

export async function captureElementAsPng(node: HTMLElement) {
	const bounds = node.getBoundingClientRect()

	if (!bounds.width || !bounds.height) {
		throw new Error("The PnL card must be visible before it can be shared.")
	}

	const width = Math.ceil(bounds.width)
	const { clone, cleanup } = await createCaptureClone(node, width)

	try {
		const cloneBounds = clone.getBoundingClientRect()

		if (!cloneBounds.width || !cloneBounds.height) {
			throw new Error("The PnL card must be visible before it can be shared.")
		}

		const { getFontEmbedCSS, toBlob } = await import("html-to-image")
		const fontEmbedCSS = await getFontEmbedCSS(clone)
		const pixelRatio = Math.max(window.devicePixelRatio || 1, MIN_PIXEL_RATIO)

		const blob = await toBlob(clone, {
			backgroundColor: resolveBackgroundColor(clone),
			cacheBust: true,
			filter: (currentNode) => {
				return !(currentNode instanceof HTMLElement && currentNode.dataset.shareIgnore === "true")
			},
			fontEmbedCSS,
			height: Math.ceil(cloneBounds.height),
			imagePlaceholder: TRANSPARENT_IMAGE_PLACEHOLDER,
			pixelRatio,
			skipAutoScale: true,
			width,
		})

		if (!blob) {
			throw new Error("Failed to create the share image.")
		}

		return blob
	} finally {
		cleanup()
	}
}
