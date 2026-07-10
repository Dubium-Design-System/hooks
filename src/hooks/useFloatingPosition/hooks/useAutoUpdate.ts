import { useCallback } from "react"

import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect"

interface UseAutoUpdateParams {
	/** Флаг активности автообновления. */
	enabled: boolean
	/** Floating-элемент. */
	floatingElement: HTMLElement | null
	/** Reference-элемент. */
	referenceElement: HTMLElement | null
	/** Функция обновления позиции. */
	update: VoidFunction
}

/**
 * Подписывает позиционирование на scroll, resize, visualViewport и ResizeObserver.
 *
 * @param params - Параметры автообновления.
 */
export const useAutoUpdate = ({ enabled, floatingElement, referenceElement, update }: UseAutoUpdateParams): void => {
	const handleUpdate = useCallback(() => {
		update()
	}, [update])

	useIsomorphicLayoutEffect(() => {
		if (!enabled || !referenceElement || !floatingElement) {
			return undefined
		}

		handleUpdate()

		window.addEventListener("scroll", handleUpdate, true)
		window.addEventListener("resize", handleUpdate)

		window.visualViewport?.addEventListener("resize", handleUpdate)
		window.visualViewport?.addEventListener("scroll", handleUpdate)

		let resizeObserver: null | ResizeObserver = null

		if (typeof ResizeObserver !== "undefined") {
			resizeObserver = new ResizeObserver(handleUpdate)

			resizeObserver.observe(referenceElement)
			resizeObserver.observe(floatingElement)
		}

		return () => {
			window.removeEventListener("scroll", handleUpdate, true)
			window.removeEventListener("resize", handleUpdate)

			window.visualViewport?.removeEventListener("resize", handleUpdate)
			window.visualViewport?.removeEventListener("scroll", handleUpdate)

			resizeObserver?.disconnect()
		}
	}, [enabled, floatingElement, handleUpdate, referenceElement])
}
