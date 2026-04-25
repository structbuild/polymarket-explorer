"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { useHorizontalScrollState } from "@/lib/hooks/use-horizontal-scroll-state"
import { cn } from "@/lib/utils"

const FADE_WIDTH = "2rem"
const SCROLL_STEP_PX = 320

function buildScrollMask(canScrollLeft: boolean, canScrollRight: boolean) {
  if (!canScrollLeft && !canScrollRight) {
    return undefined
  }

  const leftStop = canScrollLeft ? "transparent" : "black"
  const rightStop = canScrollRight ? "transparent" : "black"

  return `linear-gradient(to right, ${leftStop}, black ${FADE_WIDTH}, black calc(100% - ${FADE_WIDTH}), ${rightStop})`
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
        "absolute top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-background hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        direction === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const { canScrollLeft, canScrollRight } = useHorizontalScrollState(containerRef)
  const maskImage = buildScrollMask(canScrollLeft, canScrollRight)

  const scrollBy = (delta: number) => {
    containerRef.current?.scrollBy({ left: delta, behavior: "smooth" })
  }

  return (
    <div data-slot="table-wrapper" className="relative w-full">
      <div
        ref={containerRef}
        data-slot="table-container"
        className="w-full overflow-x-auto"
        style={maskImage ? { maskImage, WebkitMaskImage: maskImage } : undefined}
      >
        <table
          data-slot="table"
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        />
      </div>
      {canScrollLeft ? (
        <ScrollHintButton direction="left" onClick={() => scrollBy(-SCROLL_STEP_PX)} />
      ) : null}
      {canScrollRight ? (
        <ScrollHintButton direction="right" onClick={() => scrollBy(SCROLL_STEP_PX)} />
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
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
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
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
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
