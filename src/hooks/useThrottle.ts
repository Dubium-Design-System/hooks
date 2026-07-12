import { useEffect, useRef, useState } from "react"

/**
 * Опции хука `useThrottle`.
 */
export interface IUseThrottleOptions {
	/** Интервал троттлинга в миллисекундах. */
	interval?: number
	/** Флаг немедленного обновления при первом изменении. */
	leading?: boolean
	/** Флаг обновления в конце интервала. */
	trailing?: boolean
}

/**
 * Нормализует интервал: проверяет конечность и неотрицательность.
 *
 * @param interval - Исходный интервал.
 * @returns Нормализованный интервал.
 */
const normalizeInterval = (interval: number): number => {
	if (Number.isFinite(interval)) {
		return Math.max(0, interval)
	}

	return 0
}

/**
 * Возвращает троттлированное значение, которое обновляется не чаще указанного интервала.
 *
 * Поддерживает опции leading (первое обновление сразу) и trailing (обновление в конце интервала).
 *
 * @param value - Значение, которое нужно троттлить.
 * @param options - Опции троттлинга.
 * @returns Троттлированное значение.
 */
export const useThrottle = <T>(
	value: T,
	{ interval = 200, leading = true, trailing = true }: IUseThrottleOptions = {},
): T => {
	/** Троттлированное значение. */
	const [throttledValue, setThrottledValue] = useState(value)
	/** Ref для хранения последнего полученного значения. */
	const latestValueRef = useRef(value)
	/** Ref для хранения идентификатора таймаута. */
	const timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
	/** Ref для хранения времени последнего выполнения. */
	const lastExecutionRef = useRef(0)
	/** Ref для отслеживания первого монтирования. */
	const mountedRef = useRef(false)
	/** Безопасный интервал. */
	const safeInterval = normalizeInterval(interval)

	useEffect(() => {
		latestValueRef.current = value

		if (!mountedRef.current) {
			mountedRef.current = true

			return undefined
		}

		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}

		const now = Date.now()
		const elapsed = lastExecutionRef.current === 0 ? Number.POSITIVE_INFINITY : now - lastExecutionRef.current

		if (safeInterval === 0 || (leading && elapsed >= safeInterval)) {
			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null
				lastExecutionRef.current = Date.now()
				setThrottledValue(latestValueRef.current)
			}, 0)

			return () => {
				if (timeoutRef.current !== null) {
					clearTimeout(timeoutRef.current)
					timeoutRef.current = null
				}
			}
		}

		if (!trailing) {
			return undefined
		}

		const wait = lastExecutionRef.current === 0 ? safeInterval : Math.max(safeInterval - elapsed, 0)

		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null
			lastExecutionRef.current = Date.now()
			setThrottledValue(latestValueRef.current)
		}, wait)

		return () => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
		}
	}, [leading, safeInterval, trailing, value])

	return throttledValue
}
