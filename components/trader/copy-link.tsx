"use client";

import { Button } from "@/components/ui/button";
import { CheckIcon, LinkIcon } from "lucide-react";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

export function CopyLink() {
	const { isCopied, copy } = useCopyToClipboard();
	const pathname = usePathname();

	const handleCopy = () => {
		const url = `${window.location.origin}${pathname}`;
		posthog.capture("link_copied", { pathname });
		copy(url);
	};

	return (
		<Button className="w-full lg:w-fit" size="lg" variant="secondary" onClick={handleCopy}>
			{isCopied ? <CheckIcon /> : <LinkIcon />}
			{isCopied ? "Copied!" : "Copy Link"}
		</Button>
	);
}
