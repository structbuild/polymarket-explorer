"use client"

import { useCallback, useMemo, useSyncExternalStore, type SetStateAction } from "react"

const LOCAL_STORAGE_CHANGE_EVENT = "local-storage-change"

type UseLocalStorageOptions<T> = {
	serialize?: (value: T) => string
	deserialize?: (value: string) => T
}

type LocalStorageChangeDetail = {
	key: string
}

function resolveInitialValue<T>(initialValue: T | (() => T)): T {
	return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue
}

function deserializeJson<T>(value: string): T {
	return JSON.parse(value) as T
}

function readLocalStorageSnapshot(key: string) {
	if (typeof window === "undefined") {
		return null
	}

	try {
		return window.localStorage.getItem(key)
	} catch {
		return null
	}
}

function deserializeSnapshot<T>(
	snapshot: string | null,
	initialValue: T,
	deserialize: (value: string) => T,
) {
	if (snapshot === null) {
		return initialValue
	}

	try {
		return deserialize(snapshot)
	} catch {
		return initialValue
	}
}

export function useLocalStorage<T>(
	key: string,
	initialValue: T | (() => T),
	options: UseLocalStorageOptions<T> = {},
) {
	const deserialize = options.deserialize ?? deserializeJson<T>
	const serialize = options.serialize ?? JSON.stringify
	const resolvedInitialValue = useMemo(() => resolveInitialValue(initialValue), [initialValue])

	const subscribe = useCallback((onStoreChange: () => void) => {
		if (typeof window === "undefined") {
			return () => {}
		}

		const handleChange = (event: Event) => {
			if (event instanceof StorageEvent) {
				if (event.storageArea !== window.localStorage || event.key !== key) {
					return
				}
			} else {
				const customEvent = event as CustomEvent<LocalStorageChangeDetail>

				if (customEvent.detail?.key !== key) {
					return
				}
			}

			onStoreChange()
		}

		window.addEventListener("storage", handleChange)
		window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleChange as EventListener)

		return () => {
			window.removeEventListener("storage", handleChange)
			window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleChange as EventListener)
		}
	}, [key])

	const getSnapshot = useCallback(() => readLocalStorageSnapshot(key), [key])

	const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null)
	const value = useMemo(
		() => deserializeSnapshot(snapshot, resolvedInitialValue, deserialize),
		[deserialize, resolvedInitialValue, snapshot],
	)

	const notifyChange = useCallback(() => {
		window.dispatchEvent(new CustomEvent<LocalStorageChangeDetail>(LOCAL_STORAGE_CHANGE_EVENT, { detail: { key } }))
	}, [key])

	const setValue = useCallback((nextValue: SetStateAction<T>) => {
		if (typeof window === "undefined") {
			return
		}

		const currentValue = deserializeSnapshot(getSnapshot(), resolvedInitialValue, deserialize)
		const resolvedValue = typeof nextValue === "function"
			? (nextValue as (currentValue: T) => T)(currentValue)
			: nextValue

		try {
			window.localStorage.setItem(key, serialize(resolvedValue))
			notifyChange()
		} catch {
			// Ignore storage failures and keep the in-memory UI responsive.
		}
	}, [deserialize, getSnapshot, key, notifyChange, resolvedInitialValue, serialize])

	const removeValue = useCallback(() => {
		if (typeof window === "undefined") {
			return
		}

		try {
			window.localStorage.removeItem(key)
			notifyChange()
		} catch {
			// Ignore storage failures and keep the in-memory UI responsive.
		}
	}, [key, notifyChange])

	return [value, setValue, removeValue] as const
}
