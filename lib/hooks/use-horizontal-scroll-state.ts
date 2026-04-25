"use client"

import { useLayoutEffect, useState, type RefObject } from "react"

const ROUNDING_TOLERANCE_PX = 1

export type HorizontalScrollState = {
	canScrollLeft: boolean
	canScrollRight: boolean
}

export function useHorizontalScrollState(
	ref: RefObject<HTMLElement | null>,
): HorizontalScrollState {
	const [state, setState] = useState<HorizontalScrollState>({
		canScrollLeft: false,
		canScrollRight: false,
	})

	useLayoutEffect(() => {
		const element = ref.current

		if (!element) {
			return
		}

		const measure = () => {
			const { scrollLeft, scrollWidth, clientWidth } = element
			const canScrollLeft = scrollLeft > ROUNDING_TOLERANCE_PX
			const canScrollRight =
				scrollLeft + clientWidth < scrollWidth - ROUNDING_TOLERANCE_PX

			setState((previous) =>
				previous.canScrollLeft === canScrollLeft &&
				previous.canScrollRight === canScrollRight
					? previous
					: { canScrollLeft, canScrollRight },
			)
		}

		measure()

		element.addEventListener("scroll", measure, { passive: true })

		const resizeObserver = new ResizeObserver(measure)
		resizeObserver.observe(element)

		const firstChild = element.firstElementChild

		if (firstChild) {
			resizeObserver.observe(firstChild)
		}

		return () => {
			element.removeEventListener("scroll", measure)
			resizeObserver.disconnect()
		}
	}, [ref])

	return state
}
