import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { pathToFileURL } from "node:url"

import ts from "typescript"

const source = readFileSync(new URL("../lib/trader-position-pnl.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, {
	compilerOptions: {
		module: ts.ModuleKind.ES2022,
		target: ts.ScriptTarget.ES2022,
	},
}).outputText
const compiledPath = join(tmpdir(), `trader-position-pnl-${process.pid}.mjs`)
writeFileSync(compiledPath, compiled)

const { getTraderPositionPnlDisplay } = await import(pathToFileURL(compiledPath).href)

function assertClose(actual, expected, message) {
	assert.ok(Math.abs(actual - expected) < 1e-6, `${message}: expected ${expected}, received ${actual}`)
}

test("open positions display unrealized PnL on currently-held shares", () => {
	const row = {
		title: "Huzhou: Polona Hercog vs Xinyu Gao",
		outcome: "No",
		total_shares_bought: 2827.843462,
		total_shares_sold: 0,
		current_shares_balance: 1570.107431,
		total_buy_usd: 746.685676,
		avg_entry_price: 0.2640477402776406,
		current_price: 0.46,
		current_value: 722.24941826,
		realized_pnl_usd: -750.8865219999999,
		realized_pnl_pct: -100.56259898040416,
	}

	const pnl = getTraderPositionPnlDisplay(row)

	const expectedValue = row.current_shares_balance * (row.current_price - row.avg_entry_price)
	const expectedPercent = ((row.current_price - row.avg_entry_price) / row.avg_entry_price) * 100
	assertClose(pnl.value, expectedValue, "open held-portion value")
	assertClose(pnl.colorValue, expectedValue, "open colorValue")
	assertClose(pnl.percent, expectedPercent, "open percent")
	assert.ok(pnl.value > 0, "current_price above entry should yield positive PnL")
})

test("closed positions (no held shares) display realized PnL", () => {
	const row = {
		title: "Flyers vs. Penguins",
		outcome: "No",
		total_shares_bought: 36466.030284,
		total_shares_sold: 0,
		current_shares_balance: 0,
		total_buy_usd: 24145.221814,
		redemption_usd: 36466.030284,
		realized_pnl_usd: 12300.9111676,
		realized_pnl_pct: 50.94552977130915,
	}

	const pnl = getTraderPositionPnlDisplay(row)

	assert.equal(pnl.value, row.realized_pnl_usd)
	assert.equal(pnl.colorValue, row.realized_pnl_usd)
	assert.equal(pnl.percent, row.realized_pnl_pct)
})

test("open positions with partial sells use held-portion unrealized only", () => {
	const row = {
		total_shares_bought: 100,
		total_shares_sold: 40,
		current_shares_balance: 60,
		total_buy_usd: 40,
		total_sell_usd: 30,
		avg_entry_price: 0.4,
		current_price: 0.5,
		current_value: 30,
		realized_pnl_usd: -10,
		realized_pnl_pct: -25,
	}

	const pnl = getTraderPositionPnlDisplay(row)

	assertClose(pnl.value, 6, "held-portion value (60 × (0.5 − 0.4))")
	assertClose(pnl.colorValue, 6, "colorValue")
	assertClose(pnl.percent, 25, "held-portion percent ((0.5/0.4 − 1) × 100)")
})

test("entry-unknown open position (avg_entry_price = 0) falls back to realized PnL", () => {
	const row = {
		current_shares_balance: 1000,
		avg_entry_price: 0,
		current_price: 0.5,
		realized_pnl_usd: -123.45,
		total_buy_usd: 500,
	}

	const pnl = getTraderPositionPnlDisplay(row)

	assert.equal(pnl.value, -123.45)
	assert.equal(pnl.colorValue, -123.45)
	assertClose(pnl.percent, (-123.45 / 500) * 100, "fallback percent from total_buy_usd")
})

test("realized percent is capped at -100% when fees push loss past cost basis", () => {
	const row = {
		current_shares_balance: 0,
		realized_pnl_usd: -750.8865219999999,
		realized_pnl_pct: -100.56259898040416,
		total_buy_usd: 746.685676,
	}

	const pnl = getTraderPositionPnlDisplay(row)

	assert.equal(pnl.value, row.realized_pnl_usd)
	assert.equal(pnl.percent, -100)
})
