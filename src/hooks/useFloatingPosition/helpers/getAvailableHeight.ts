import type { FloatingPlacement, FloatingViewportRect } from "../useFloatingPosition.types"

import { parseFloatingPlacement } from "./parseFloatingPlacement"

interface GetAvailableHeightParams {
	/** Флаг или числовой лимит максимальной высоты. */
	maxHeight: boolean | number
	/** Отступ между reference и floating-элементом. */
	offset: number
	/** Минимальный отступ от границ viewport. */
	padding: number
	/** Итоговое расположение floating-элемента. */
	placement: FloatingPlacement
	/** Прямоугольник reference-элемента. */
	referenceRect: DOMRect
	/** Прямоугольник viewport. */
	viewportRect: FloatingViewportRect
}

/**
 * Считает доступную высоту для floating-элемента.
 *
 * @param params - Параметры расчёта доступной высоты.
 * @returns Доступная высота или `null`, если ограничение отключено.
 */
export const getAvailableHeight = ({
	maxHeight,
	offset,
	padding,
	placement,
	referenceRect,
	viewportRect,
}: GetAvailableHeightParams): null | number => {
	if (!maxHeight) {
		return null
	}

	const { side } = parseFloatingPlacement(placement)

	let availableHeight = viewportRect.height - padding * 2

	if (side === "top") {
		availableHeight = referenceRect.top - viewportRect.top - offset - padding
	}

	if (side === "bottom") {
		availableHeight = viewportRect.bottom - referenceRect.bottom - offset - padding
	}

	const normalizedAvailableHeight = Math.max(0, availableHeight)

	if (typeof maxHeight === "number") {
		return Math.min(maxHeight, normalizedAvailableHeight)
	}

	return normalizedAvailableHeight
}
