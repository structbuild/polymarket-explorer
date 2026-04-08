import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, length: number = 6) {
	return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function getTraderDisplayName(trader: { address: string; name?: string | null; pseudonym?: string | null }) {
	return trader.name ?? trader.pseudonym ?? truncateAddress(trader.address);
}

export function isWalletAddress(value: string) {
	return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

export function normalizeWalletAddress(value: string) {
	const trimmed = value.trim();
	return isWalletAddress(trimmed) ? trimmed.toLowerCase() : null;
}

