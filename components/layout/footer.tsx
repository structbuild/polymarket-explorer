import Link from "next/link";
import { StructLogo } from "@/components/ui/svgs/struct-logo";
import { Github } from "@/components/ui/svgs/github";

export default function Footer() {
	return (
		<footer className="relative z-10">
			<div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-center sm:h-16 sm:flex-row sm:px-6 sm:py-0 sm:text-left">
				<p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
					Polymarket Explorer made by{" "}
					<Link href="https://www.struct.to" target="_blank" className="transition-opacity hover:opacity-80">
						<StructLogo className="h-4 text-white" />
						<span className="sr-only">Struct</span>
					</Link>
				</p>
				<p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-end">
					View source code on{" "}
					<Link
						href="https://github.com/structbuild/polymarket-explorer"
						className="group flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
						target="_blank"
					>
						<Github className="size-4" />
						GitHub
					</Link>
				</p>
			</div>
		</footer>
	);
}
