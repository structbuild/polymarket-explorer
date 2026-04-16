"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function HomeRefreshButton() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<Button
			variant="outline"
			size="sm"
			className="shrink-0"
			onClick={() => {
				startTransition(() => {
					router.refresh();
				});
			}}
			disabled={isPending}
		>
			<RefreshCwIcon data-icon="inline-start" />
			Refresh
		</Button>
	);
}
