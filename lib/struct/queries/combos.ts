import "server-only";

import type { V31ComboPnlResponse } from "@structbuild/sdk";

import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import { normalizeWalletAddress } from "@/lib/utils";

export async function getTraderComboPnl(
	address: string,
	params: { positionId?: string | null; conditionId?: string | null },
): Promise<V31ComboPnlResponse | null> {
	const client = getStructClient();
	const normalizedAddress = normalizeWalletAddress(address);
	const positionId = params.positionId ?? undefined;
	const conditionId = params.conditionId ?? undefined;

	if (!client || !normalizedAddress || (!positionId && !conditionId)) {
		return null;
	}

	try {
		const response = await client.trader.getTraderComboPnl({
			address: normalizedAddress,
			...(positionId ? { position_id: positionId } : {}),
			...(conditionId ? { condition_id: conditionId } : {}),
		});
		return response.data ?? null;
	} catch (error) {
		const status = readStatus(error);
		if (status === 404 || status === 400) {
			return null;
		}

		logStructError(`getTraderComboPnl:${normalizedAddress}`, error);
		return null;
	}
}
