"use client";

import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CopyAddress({ address }: { address: string }) {
	const [isCopied, setIsCopied] = useState(false);
	const resetTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (resetTimeoutRef.current !== null) {
				window.clearTimeout(resetTimeoutRef.current);
			}
		};
	}, []);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(address);
			setIsCopied(true);

			if (resetTimeoutRef.current !== null) {
				window.clearTimeout(resetTimeoutRef.current);
			}

			resetTimeoutRef.current = window.setTimeout(() => {
				setIsCopied(false);
				resetTimeoutRef.current = null;
			}, 1500);
		} catch {
			setIsCopied(false);
		}
	};

	return (
		<Button size="sm" variant="secondary" className="group max-w-full" onClick={handleCopy} title={address}>
			{isCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
			<span className="max-w-[8rem] truncate sm:max-w-none">{truncateAddress(address, 4)}</span>
		</Button>
	);
}
