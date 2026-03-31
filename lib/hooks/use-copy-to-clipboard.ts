import { useEffect, useRef, useState } from "react";

export function useCopyToClipboard(resetDelay = 1500) {
	const [isCopied, setIsCopied] = useState(false);
	const resetTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (resetTimeoutRef.current !== null) {
				window.clearTimeout(resetTimeoutRef.current);
			}
		};
	}, []);

	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setIsCopied(true);

			if (resetTimeoutRef.current !== null) {
				window.clearTimeout(resetTimeoutRef.current);
			}

			resetTimeoutRef.current = window.setTimeout(() => {
				setIsCopied(false);
				resetTimeoutRef.current = null;
			}, resetDelay);
		} catch {
			setIsCopied(false);
		}
	};

	return { isCopied, copy };
}
