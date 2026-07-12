import type { IFloatingViewportRect } from "../useFloatingPosition.types"

/**
 * Проверяет, пересекается ли прямоугольник с viewport.
 *
 * @param rect - Проверяемый прямоугольник.
 * @param viewportRect - Прямоугольник viewport.
 * @returns `true`, если прямоугольник виден хотя бы частично.
 */
export const isRectVisible = (rect: DOMRect, viewportRect: IFloatingViewportRect): boolean => {
	if (rect.width <= 0 || rect.height <= 0) {
		return false
	}

	return (
		rect.bottom > viewportRect.top &&
		rect.top < viewportRect.bottom &&
		rect.right > viewportRect.left &&
		rect.left < viewportRect.right
	)
}
