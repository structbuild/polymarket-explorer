import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address?: string | null, length: number = 6) {
	if (!address) return "—";
	if (address.length <= length * 2) return address;
	return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function getTraderDisplayName(trader: { address?: string; name?: string | null; pseudonym?: string | null }) {
	return trader.name ?? trader.pseudonym ?? truncateAddress(trader.address);
}

export function isWalletAddress(value: string) {
	return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

export function isBytes32Hex(value: string) {
	return /^0x[0-9a-fA-F]{64}$/.test(value.trim());
}

export function formatBuilderCodeDisplay(code: string, length: number = 4) {
	const trimmed = code.trim();
	if (!trimmed) return code;
	if (isWalletAddress(trimmed) || isBytes32Hex(trimmed)) return truncateAddress(trimmed, length);
	const prefixed = /^0x/i.test(trimmed) ? trimmed : `0x${trimmed}`;
	if (isWalletAddress(prefixed) || isBytes32Hex(prefixed)) return truncateAddress(prefixed, length);
	return trimmed;
}

export function normalizeWalletAddress(value: string) {
	const trimmed = value.trim();
	return isWalletAddress(trimmed) ? trimmed.toLowerCase() : null;
}

