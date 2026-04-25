"use client"

import { createContext, useContext } from "react"

export const ShareModeContext = createContext(false)

export function useShareMode(): boolean {
	return useContext(ShareModeContext)
}
