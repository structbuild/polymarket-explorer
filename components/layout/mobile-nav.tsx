"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { NAV_ITEMS } from "./nav-items";

export function MobileNav() {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label="Open navigation menu"
				className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:hidden"
			>
				<MenuIcon className="size-4" />
			</button>
			<SheetContent
				side="top"
				className="gap-0 rounded-b-2xl p-0 pt-[env(safe-area-inset-top)]"
			>
				<SheetTitle className="sr-only">Navigation</SheetTitle>
				<nav className="flex flex-col gap-0.5 p-2 pt-10">
					{NAV_ITEMS.map((item) => {
						const isActive =
							pathname === item.href || pathname.startsWith(`${item.href}/`);
						return (
							<Link
								key={item.href}	
								href={item.href}
								target={item.external ? "_blank" : undefined}
								onClick={() => setOpen(false)}
								aria-current={isActive ? "page" : undefined}
								className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground"
							>
								{item.label}
							</Link>
						);
					})}
				</nav>
			</SheetContent>
		</Sheet>
	);
}
