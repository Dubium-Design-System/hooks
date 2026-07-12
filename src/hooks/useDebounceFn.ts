import { useCallback, useEffect, useMemo, useRef } from "react"

/**
 * Любая функция.
 */
type TAnyFunction = (...args: never[]) => unknown

/**
 * Дебаунс-функция с методами управления.
 */
export interface IDebouncedFunction<T extends TAnyFunction> {
	(...args: Parameters<T>): void
	/** Отменяет запланированный вызов. */
	cancel: VoidFunction
	/** Немедленно выполняет запланированный вызов. */
	flush: () => ReturnType<T> | undefined
	/** Проверяет, ожидает ли вызов выполнения. */
	isPending: () => boolean
}

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
 * Возвращает дебаунс-функцию с методами управления.
 *
 * Отличается от `useDebounce` тем, что дебаунсит саму функцию,
 * а не значение. Предоставляет методы `cancel`, `flush` и `isPending`.
 *
 * @param callback - Функция, которую нужно дебаунсить.
 * @param delay - Задержка в миллисекундах.
 * @returns Дебаунс-функция с методами управления.
 */
export const useDebounceFn = <T extends TAnyFunction>(callback: T, delay = 0): IDebouncedFunction<T> => {
	/** Ref для хранения актуального колбэка. */
	const callbackRef = useRef(callback)
	/** Ref для хранения аргументов последнего вызова. */
	const argsRef = useRef<null | Parameters<T>>(null)
	/** Ref для хранения идентификатора таймаута. */
	const timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
	/** Безопасная задержка. */
	const safeDelay = normalizeDelay(delay)

	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	/** Отменяет запланированный вызов. */
	const cancel = useCallback((): void => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}

		argsRef.current = null
	}, [])

	/** Немедленно выполняет запланированный вызов. */
	const flush = useCallback((): ReturnType<T> | undefined => {
		if (timeoutRef.current === null || argsRef.current === null) {
			return undefined
		}

		const args = argsRef.current
		cancel()

		return callbackRef.current(...args) as ReturnType<T>
	}, [cancel])

	/** Проверяет, ожидает ли вызов выполнения. */
	const isPending = useCallback((): boolean => {
		return timeoutRef.current !== null
	}, [])

	/** Выполняет функцию с дебаунсом. */
	const run = useCallback(
		(...args: Parameters<T>): void => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}

			if (safeDelay === 0) {
				argsRef.current = null
				callbackRef.current(...args)

				return
			}

			argsRef.current = args
			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null

				const latestArgs = argsRef.current
				argsRef.current = null

				if (latestArgs !== null) {
					callbackRef.current(...latestArgs)
				}
			}, safeDelay)
		},
		[safeDelay],
	)

	/** Дебаунс-функция с привязанными методами управления. */
	const debounced = useMemo(
		() => Object.assign(run, { cancel, flush, isPending }) as IDebouncedFunction<T>,
		[cancel, flush, isPending, run],
	)

	useEffect(() => {
		return cancel
	}, [cancel, safeDelay])

	return debounced
}
