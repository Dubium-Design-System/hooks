import { useEffect, useRef, useState } from "react"

/**
 * Хук для троттлинга обновлений значения.
 *
 * @param value Исходное значение.
 * @param delay Интервал обновления в миллисекундах.
 * @returns Троттлированное значение.
 */
export const useThrottle = <T>(value: T, delay = 200): T => {
	const [throttledValue, setThrottledValue] = useState<T>(value)

	const timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
	const lastUpdatedRef = useRef<null | number>(null)
	const nextValueRef = useRef(value)

	useEffect(() => {
		nextValueRef.current = value

		if (lastUpdatedRef.current === null) {
			lastUpdatedRef.current = Date.now()
		} else {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
			}

			const elapsed = Date.now() - lastUpdatedRef.current
			const remaining = Math.max(delay - elapsed, 0)

			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null
				lastUpdatedRef.current = Date.now()

				setThrottledValue(nextValueRef.current)
			}, remaining)
		}

		return () => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
		}
	}, [value, delay])

	return throttledValue
}
