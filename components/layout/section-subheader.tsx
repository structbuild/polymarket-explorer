"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionSubheader({
	floating = false,
	visible = true,
	children,
}: {
	floating?: boolean;
	visible?: boolean;
	children: ReactNode;
}) {
	return (
		<div
			aria-hidden={floating && !visible}
			className={cn(
				"z-40 border-b border-border/40 bg-background/80 backdrop-blur-md",
				floating
					? cn(
							"fixed inset-x-0 top-14 transition-opacity duration-200 sm:top-16",
							visible ? "opacity-100" : "pointer-events-none invisible opacity-0",
						)
					: "sticky top-14 sm:top-16",
			)}
		>
			<div className="mx-auto flex h-10 w-full max-w-7xl items-center px-4 sm:px-6">
				<nav className="flex w-full items-center gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
					{children}
				</nav>
			</div>
		</div>
	);
}

export function SubheaderNavButton({
	active,
	onSelect,
	targetId,
	children,
}: {
	active: boolean;
	onSelect: () => void;
	targetId?: string;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			data-active={active || undefined}
			data-section-target={targetId}
			onClick={onSelect}
			className={cn(
				"relative shrink-0 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground/80",
				"after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity",
				"data-active:text-foreground data-active:after:opacity-100",
			)}
		>
			{children}
		</button>
	);
}
