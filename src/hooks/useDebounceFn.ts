import { useCallback, useEffect, useMemo, useRef } from "react"

type AnyFunction = (...args: never[]) => unknown

/**
 * Интерфейс debounce-функции с дополнительными методами управления.
 */
export interface IDebouncedFunction<T extends AnyFunction> {
	(...args: Parameters<T>): void
	cancel: VoidFunction
	flush: VoidFunction
	isPending: () => boolean
}

/**
 * Хук, создающий debounce-функцию с методами управления.
 *
 * @typeParam T - Тип оригинальной функции.
 * @param callback - Функция, вызов которой необходимо отложить.
 * @param delay - Задержка в миллисекундах.
 * @returns Debounce-функция с методами cancel, flush и isPending.
 */
export const useDebounceFn = <T extends AnyFunction>(callback: T, delay: number): IDebouncedFunction<T> => {
	const callbackRef = useRef(callback)
	const argsRef = useRef<null | Parameters<T>>(null)
	const timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)

	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	const cancel = useCallback((): void => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}

		argsRef.current = null
	}, [])

	const flush = useCallback((): void => {
		if (timeoutRef.current === null || argsRef.current === null) {
			return
		}

		const args = argsRef.current

		cancel()
		callbackRef.current(...args)
	}, [cancel])

	const isPending = useCallback((): boolean => {
		return timeoutRef.current !== null
	}, [])

	const run = useCallback(
		(...args: Parameters<T>): void => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}

			if (delay <= 0) {
				argsRef.current = null
				callbackRef.current(...args)
				return
			}

			argsRef.current = args

			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null

				const latestArgs = argsRef.current

				if (latestArgs === null) {
					return
				}

				argsRef.current = null
				callbackRef.current(...latestArgs)
			}, delay)
		},
		[delay],
	)

	const debounced = useMemo(() => {
		const debouncedFn = run as IDebouncedFunction<T>

		debouncedFn.cancel = cancel
		debouncedFn.flush = flush
		debouncedFn.isPending = isPending

		return debouncedFn
	}, [cancel, flush, isPending, run])

	useEffect(() => {
		return () => {
			cancel()
		}
	}, [cancel, delay])

	return debounced
}
