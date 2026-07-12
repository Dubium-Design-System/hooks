import { useEffect, useState } from "react"

/**
 * Нормализует задержку: проверяет конечность и неотрицательность.
 *
 * @param delay - Исходная задержка.
 * @returns Нормализованная задержка.
 */
const normalizeDelay = (delay: number): number => {
	if (Number.isFinite(delay)) {
		return Math.max(0, delay)
	}

	return 0
}

/**
 * Возвращает отложенное значение, которое обновляется после указанной задержки.
 *
 * Полезно для поиска при вводе, фильтрации и других сценариев,
 * где нужно избежать частых обновлений.
 *
 * @param value - Значение, которое нужно отложить.
 * @param delay - Задержка в миллисекундах.
 * @returns Отложенное значение.
 */
export const useDebounce = <T>(value: T, delay = 0): T => {
	const [debouncedValue, setDebouncedValue] = useState(value)
	const safeDelay = normalizeDelay(delay)

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedValue(value)
		}, safeDelay)

		return () => {
			clearTimeout(timeoutId)
		}
	}, [safeDelay, value])

	if (safeDelay === 0) {
		return value
	}

	return debouncedValue
}
