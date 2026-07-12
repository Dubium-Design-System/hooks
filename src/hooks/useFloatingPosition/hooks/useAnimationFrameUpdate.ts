import { useCallback, useEffect, useRef } from "react"

import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect"

/**
 * Возвращаемое значение хука useAnimationFrameUpdate.
 */
interface IUseAnimationFrameUpdateReturn {
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
export const useAnimationFrameUpdate = (callback: VoidFunction): IUseAnimationFrameUpdateReturn => {
	/** Ref для хранения актуального колбэка. */
	const callbackRef = useRef(callback)
	/** Ref для хранения идентификатора animation frame. */
	const frameIdRef = useRef<null | number>(null)

	useIsomorphicLayoutEffect(() => {
		callbackRef.current = callback
	}, [callback])

	/** Отменяет запланированное обновление. */
	const cancelUpdate = useCallback(() => {
		if (frameIdRef.current === null) {
			return
		}

		window.cancelAnimationFrame(frameIdRef.current)
		frameIdRef.current = null
	}, [])

	/** Планирует обновление на ближайший animation frame. */
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

	useEffect(() => {
		return cancelUpdate
	}, [cancelUpdate])

	return {
		cancelUpdate,
		scheduleUpdate,
	}
}
