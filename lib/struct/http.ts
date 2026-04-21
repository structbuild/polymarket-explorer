import "server-only";

export function readStatus(error: unknown) {
	if (typeof error !== "object" || error === null) {
		return null;
	}

	const record = error as Record<string, unknown>;
	const status = record.status;

	return typeof status === "number" ? status : null;
}

export function logStructError(label: string, error: unknown) {
	console.error(`Struct SDK request failed: ${label}`, error);
}
