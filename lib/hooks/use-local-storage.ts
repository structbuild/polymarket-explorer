"use client"

import { useSyncExternalStore, type SetStateAction } from "react"

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

function readLocalStorageValue<T>(
	key: string,
	initialValue: T | (() => T),
	deserialize: (value: string) => T,
) {
	const fallbackValue = resolveInitialValue(initialValue)

	if (typeof window === "undefined") {
		return fallbackValue
	}

	try {
		const storedValue = window.localStorage.getItem(key)
		return storedValue === null ? fallbackValue : deserialize(storedValue)
	} catch {
		return fallbackValue
	}
}

export function useLocalStorage<T>(
	key: string,
	initialValue: T | (() => T),
	options: UseLocalStorageOptions<T> = {},
) {
	const deserialize = options.deserialize ?? deserializeJson<T>
	const serialize = options.serialize ?? JSON.stringify

	const value = useSyncExternalStore(
		(onStoreChange) => {
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
		},
		() => readLocalStorageValue(key, initialValue, deserialize),
		() => resolveInitialValue(initialValue),
	)

	const notifyChange = () => {
		window.dispatchEvent(new CustomEvent<LocalStorageChangeDetail>(LOCAL_STORAGE_CHANGE_EVENT, { detail: { key } }))
	}

	const setValue = (nextValue: SetStateAction<T>) => {
		if (typeof window === "undefined") {
			return
		}

		const resolvedValue = typeof nextValue === "function"
			? (nextValue as (currentValue: T) => T)(value)
			: nextValue

		try {
			window.localStorage.setItem(key, serialize(resolvedValue))
			notifyChange()
		} catch {
			// Ignore storage failures and keep the in-memory UI responsive.
		}
	}

	const removeValue = () => {
		if (typeof window === "undefined") {
			return
		}

		try {
			window.localStorage.removeItem(key)
			notifyChange()
		} catch {
			// Ignore storage failures and keep the in-memory UI responsive.
		}
	}

	return [value, setValue, removeValue] as const
}
