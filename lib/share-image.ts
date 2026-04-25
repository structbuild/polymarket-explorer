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
