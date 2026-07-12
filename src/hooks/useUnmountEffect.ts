import { useEffect, useRef } from "react"

/**
 * Выполняет эффект только при размонтировании компонента.
 *
 * Аналог `useEffect(() => fn, [])`, но с использованием ref для хранения
 * колбэка, что гарантирует выполнение самой последней версии callback.
 *
 * @param callback - Функция, которую нужно выполнить при размонтировании.
 */
export const useUnmountEffect = (callback: VoidFunction): void => {
	/** Ref для хранения актуального колбэка. */
	const callbackRef = useRef(callback)

	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	useEffect(
		() => () => {
			callbackRef.current()
		},
		[],
	)
}
