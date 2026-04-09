"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { refreshRewardsPageAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function RewardsRefreshButton() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<Button
			variant="outline"
			size="sm"
			className="shrink-0"
			onClick={() => {
				startTransition(async () => {
					await refreshRewardsPageAction();
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
