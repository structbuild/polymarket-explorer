import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SearchDialog } from "@/components/search/search-dialog";

export function Header() {
	return (
		<header className="relative z-10">
			<div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
				<div className="flex min-w-0 items-center gap-4">
					<Link href="/" className="flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-80">
						<Search className="size-4 shrink-0 opacity-60" />
						<span className="truncate text-sm text-foreground/90 sm:text-base">Explorer</span>
					</Link>
					<div className="h-4 w-px bg-border" />
					<nav className="flex items-center gap-1">
						<Link
							href={"/markets" as Route}
							className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							Markets
						</Link>
						<Link
							href={"/traders" as Route}
							className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							Traders
						</Link>
						<Link
							href={"/tags" as Route}
							className="hidden rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:block"
						>
							Tags
						</Link>
						<Link
							href="/rewards"
							className="hidden rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:block"
						>
							Rewards
						</Link>
					</nav>
				</div>
				<SearchDialog />
			</div>
		</header>
	);
}
