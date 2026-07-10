import { useCallback, useEffect, useRef } from "react"

import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect"

interface UseAnimationFrameUpdateReturn {
	/** Отменяет запланированное обновление. */
	cancelUpdate: VoidFunction
	/** Планирует обновление на ближайший animation frame. */
	scheduleUpdate: VoidFunction
}

/**
 * Планирует обновление через requestAnimationFrame с дедупликацией вызовов.
 *
 * @param callback - Функция, которую нужно вызвать на animation frame.
 * @returns Методы планирования и отмены обновления.
 */
export const useAnimationFrameUpdate = (callback: VoidFunction): UseAnimationFrameUpdateReturn => {
	const callbackRef = useRef(callback)
	const frameIdRef = useRef<null | number>(null)

	useIsomorphicLayoutEffect(() => {
		callbackRef.current = callback
	}, [callback])

	const cancelUpdate = useCallback(() => {
		if (frameIdRef.current === null) {
			return
		}

		window.cancelAnimationFrame(frameIdRef.current)
		frameIdRef.current = null
	}, [])

	const scheduleUpdate = useCallback(() => {
		if (typeof window === "undefined") {
			return
		}

		if (frameIdRef.current !== null) {
			return
		}

		frameIdRef.current = window.requestAnimationFrame(() => {
			frameIdRef.current = null
			callbackRef.current()
		})
	}, [])

	useEffect(() => cancelUpdate, [cancelUpdate])

	return {
		cancelUpdate,
		scheduleUpdate,
	}
}
