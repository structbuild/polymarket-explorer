"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { useHorizontalScrollState } from "@/lib/hooks/use-horizontal-scroll-state"
import { cn } from "@/lib/utils"

const SCROLL_STEP_PX = 320

type ScrollFadeProps = {
  direction: "left" | "right"
  visible: boolean
}

function ScrollFade({ direction, visible }: ScrollFadeProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 z-10 w-8 transition-opacity duration-200",
        direction === "left"
          ? "left-0 bg-gradient-to-r from-card to-transparent"
          : "right-0 bg-gradient-to-l from-card to-transparent",
        visible ? "opacity-100" : "opacity-0",
      )}
    />
  )
}

type ScrollHintButtonProps = {
  direction: "left" | "right"
  onClick: () => void
}

function ScrollHintButton({ direction, onClick }: ScrollHintButtonProps) {
  const Icon = direction === "left" ? ChevronLeftIcon : ChevronRightIcon
  const ariaLabel = direction === "left" ? "Scroll table left" : "Scroll table right"

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "pointer-events-auto absolute flex size-7 items-center justify-center rounded-full border bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-background hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        direction === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const { canScrollLeft, canScrollRight } = useHorizontalScrollState(containerRef)
  const showHints = canScrollLeft || canScrollRight
  const [hintTop, setHintTop] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!showHints) {
      return
    }

    const wrapper = wrapperRef.current
    if (!wrapper) {
      return
    }

    let frame = 0

    const measure = () => {
      frame = 0
      const rect = wrapper.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const visibleTop = Math.max(0, rect.top)
      const visibleBottom = Math.min(viewportHeight, rect.bottom)

      if (visibleBottom <= visibleTop) {
        return
      }

      const visibleCenter = (visibleTop + visibleBottom) / 2
      setHintTop(visibleCenter - rect.top)
    }

    const schedule = () => {
      if (frame !== 0) return
      frame = window.requestAnimationFrame(measure)
    }

    measure()

    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(wrapper)

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
      }
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      resizeObserver.disconnect()
    }
  }, [showHints])

  const scrollBy = (delta: number) => {
    containerRef.current?.scrollBy({ left: delta, behavior: "smooth" })
  }

  return (
    <div ref={wrapperRef} data-slot="table-wrapper" className="relative w-full">
      <div
        ref={containerRef}
        data-slot="table-container"
        className="w-full overflow-x-auto"
      >
        <table
          data-slot="table"
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        />
      </div>
      <ScrollFade direction="left" visible={canScrollLeft} />
      <ScrollFade direction="right" visible={canScrollRight} />
      {showHints && hintTop !== null ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-10 -translate-y-1/2"
          style={{ top: hintTop }}
        >
          {canScrollLeft ? (
            <ScrollHintButton direction="left" onClick={() => scrollBy(-SCROLL_STEP_PX)} />
          ) : null}
          {canScrollRight ? (
            <ScrollHintButton direction="right" onClick={() => scrollBy(SCROLL_STEP_PX)} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-4 py-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
