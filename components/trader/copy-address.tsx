"use client";

import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";

export function CopyAddress({ address }: { address: string }) {
	const { isCopied, copy } = useCopyToClipboard();

	return (
		<Button size="sm" variant="secondary" className="group max-w-full" onClick={() => copy(address)} title={address}>
			{isCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
			<span className="max-w-32 truncate sm:max-w-none">{truncateAddress(address, 4)}</span>
		</Button>
	);
}
