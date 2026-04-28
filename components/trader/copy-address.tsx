"use client";

import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import posthog from "posthog-js";

type CopyAddressProps = {
	address: string;
	eventName?: string;
	displayText?: string;
	iconOnly?: boolean;
};

export function CopyAddress({
	address,
	eventName = "trader_address_copied",
	displayText,
	iconOnly = false,
}: CopyAddressProps) {
	const { isCopied, copy } = useCopyToClipboard();
	const label = displayText ?? truncateAddress(address, 4);

	return (
		<Button
			type="button"
			size={iconOnly ? "icon-sm" : "sm"}
			variant="secondary"
			className={iconOnly ? "shrink-0" : "group max-w-full"}
			onClick={() => {
				posthog.capture(eventName);
				copy(address);
			}}
			title={address}
			aria-label={
				iconOnly ? (isCopied ? "Copied to clipboard" : `Copy ${address}`) : undefined
			}
		>
			{isCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
			{!iconOnly ? (
				<span className="max-w-32 truncate sm:max-w-none">{label}</span>
			) : null}
		</Button>
	);
}
