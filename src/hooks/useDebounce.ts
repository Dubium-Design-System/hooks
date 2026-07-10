import { useEffect, useState } from "react"

/**
 * Хук для отложенного обновления значения (debounce).
 *
 * @template T Тип debounce-значения.
 * @param value Исходное значение.
 * @param delay Задержка в миллисекундах.
 * @returns Отложенное значение.
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("")
 * const debouncedSearch = useDebounce(search, 300)
 * ```
 */
export const useDebounce = <T>(value: T, delay: number): T => {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout> | undefined

		if (delay > 0) {
			timeoutId = setTimeout(() => {
				setDebouncedValue(value)
			}, delay)
		}

		return () => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId)
			}
		}
	}, [value, delay])

	return delay <= 0 ? value : debouncedValue
}
