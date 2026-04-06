export function getMonthGrid(year: number, month: number): (number | null)[] {
	const firstDay = new Date(year, month, 1)
	const lastDay = new Date(year, month + 1, 0)
	const daysInMonth = lastDay.getDate()

	let startDow = firstDay.getDay() - 1
	if (startDow < 0) startDow = 6

	const cells: (number | null)[] = Array.from<null>({ length: startDow }).fill(null)
	for (let d = 1; d <= daysInMonth; d++) {
		cells.push(d)
	}
	while (cells.length % 7 !== 0) {
		cells.push(null)
	}

	return cells
}

export function intensityClass(pnl: number, maxAbs: number): string {
	if (maxAbs === 0) return "bg-muted"
	const ratio = Math.abs(pnl) / maxAbs

	if (pnl > 0) {
		if (ratio > 0.8) return "bg-emerald-500/90 text-white"
		if (ratio > 0.6) return "bg-emerald-500/70 text-white"
		if (ratio > 0.4) return "bg-emerald-500/50"
		if (ratio > 0.2) return "bg-emerald-500/35"
		return "bg-emerald-500/20"
	}
	if (ratio > 0.8) return "bg-red-500/90 text-white"
	if (ratio > 0.6) return "bg-red-500/70 text-white"
	if (ratio > 0.4) return "bg-red-500/50"
	if (ratio > 0.2) return "bg-red-500/35"
	return "bg-red-500/20"
}
