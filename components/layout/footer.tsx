import Link from "next/link";
import { StructLogo } from "@/components/ui/svgs/struct-logo";
import { Github } from "@/components/ui/svgs/github";

export default function Footer() {
	return (
		<div className="relative z-10 max-w-7xl w-full mx-auto px-6 h-16 flex items-center justify-between">
			<p className="text-sm text-muted-foreground flex items-center gap-1.5">
				Polymarket Explorer made by{" "}
				<Link href="https://www.struct.to" target="_blank" className="hover:opacity-80 transition-opacity">
					<StructLogo className="h-4 text-white" />
                    <span className="sr-only">Struct</span>
				</Link>
			</p>
			<p className="text-sm text-muted-foreground flex items-center gap-1.5">
				View source code on{" "}
				<Link href="https://github.com/structbuild/polymarket-explorer" className="group text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors" target="_blank">
					<Github className="size-4" />
                    GitHub
				</Link>
			</p>
		</div>
	);
}
