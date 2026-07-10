import type { FloatingViewportRect } from "../useFloatingPosition.types"

/**
 * Возвращает прямоугольник видимой части viewport.
 *
 * @returns Размеры и границы viewport.
 */
export const getViewportRect = (): FloatingViewportRect => {
	const { visualViewport } = window

	if (visualViewport) {
		const left = visualViewport.offsetLeft
		const top = visualViewport.offsetTop
		const { width } = visualViewport
		const { height } = visualViewport

		return {
			bottom: top + height,
			height,
			left,
			right: left + width,
			top,
			width,
		}
	}

	const width = window.innerWidth
	const height = window.innerHeight

	return {
		bottom: height,
		height,
		left: 0,
		right: width,
		top: 0,
		width,
	}
}
