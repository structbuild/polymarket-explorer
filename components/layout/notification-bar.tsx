"use client";

import { ArrowUpRightIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

const NOTIFICATION = {
	version: "2",
	message: "API & Explorer Update: Builder Analytics & Dashboards",
	cta: "Check it out",
	href: "/builders",
} as const;


const STORAGE_KEY = `notification-dismissed:${NOTIFICATION.version}`;

export function NotificationBar() {
	const [dismissed, setDismissed] = useLocalStorage<boolean>(STORAGE_KEY, false);

	if (dismissed) return null;

	return (
		<div className="relative z-20 bg-muted">
			<div className="relative mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-1.5 pr-12 sm:px-6 sm:pr-14">
				<Link
					href={NOTIFICATION.href}
					target="_blank"
					rel="noopener noreferrer"
					className="group flex min-w-0 max-w-full items-center justify-center gap-2 text-center text-xs text-foreground/90 transition-opacity hover:opacity-90 sm:text-sm"
				>
					<span className="truncate">{NOTIFICATION.message}</span>
					<span className="hidden shrink-0 items-center gap-0.5 text-muted-foreground transition-colors group-hover:text-foreground sm:inline-flex">
						{NOTIFICATION.cta}
						<ArrowUpRightIcon className="size-3" />
					</span>
				</Link>
				<button
					type="button"
					onClick={() => setDismissed(true)}
					aria-label="Dismiss notification"
					className="absolute right-4 top-1/2 shrink-0 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:right-6"
				>
					<XIcon className="size-4" />
				</button>
			</div>
		</div>
	);
}
