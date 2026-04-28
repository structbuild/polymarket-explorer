import Link from "next/link";
import { Suspense } from "react";
import { SearchDialog } from "@/components/search/search-dialog";
import { MobileNav } from "./mobile-nav";
import { NAV_ITEMS } from "./nav-items";
import { StructLogoMark } from "../ui/svgs/struct-logo";

export function Header() {
	return (
		<header className="relative z-10">
			<div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
				<div className="flex min-w-0 items-center gap-2 sm:gap-4">
					<Link href="/" title="Struct Polymarket Explorer" className="flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-80">
						<StructLogoMark />
						<span className="truncate text-sm text-foreground/90 sm:text-base">Explorer</span>
					</Link>
					<div className="hidden h-4 w-px bg-border sm:block" />
					<nav className="hidden items-center gap-1 sm:flex">
						{NAV_ITEMS.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								prefetch={false}
								target={item.external ? "_blank" : undefined}
								className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
							>
								{item.label}
							</Link>
						))}
					</nav>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<SearchDialog />
					<Suspense fallback={<MobileNavFallback />}>
						<MobileNav />
					</Suspense>
				</div>
			</div>
		</header>
	);
}

function MobileNavFallback() {
	return <div aria-hidden className="size-8 sm:hidden" />;
}
