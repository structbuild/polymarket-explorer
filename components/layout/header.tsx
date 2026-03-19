import { Search } from "lucide-react";
import Link from "next/link";
import { SearchDialog } from "@/components/search/search-dialog";

export function Header() {
	return (
		<div className="relative z-10 max-w-7xl w-full mx-auto px-6 h-16 flex items-center justify-between">
			<Link href="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
				<Search className="size-4 opacity-60" />
				<span className="text-foreground/90">Explorer</span>
			</Link>
			<SearchDialog />
		</div>
	);
}
