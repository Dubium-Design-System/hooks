import type { FloatingCoords, FloatingPlacement } from "../useFloatingPosition.types"

import { parseFloatingPlacement } from "./parseFloatingPlacement"

interface GetBaseFloatingCoordsParams {
	/** Прямоугольник floating-элемента. */
	floatingRect: DOMRect
	/** Отступ между reference и floating-элементом. */
	offset: number
	/** Итоговое расположение floating-элемента. */
	placement: FloatingPlacement
	/** Прямоугольник reference-элемента. */
	referenceRect: DOMRect
}

/**
 * Считает базовые координаты floating-элемента без shift-ограничений.
 *
 * @param params - Параметры расчёта координат.
 * @returns Базовые координаты floating-элемента.
 */
export const getBaseFloatingCoords = ({
	floatingRect,
	offset,
	placement,
	referenceRect,
}: GetBaseFloatingCoordsParams): FloatingCoords => {
	const { alignment, side } = parseFloatingPlacement(placement)

	let x = 0
	let y = 0

	if (side === "top") {
		y = referenceRect.top - floatingRect.height - offset
	}

	if (side === "bottom") {
		y = referenceRect.bottom + offset
	}

	if (side === "left") {
		x = referenceRect.left - floatingRect.width - offset
	}

	if (side === "right") {
		x = referenceRect.right + offset
	}

	if (side === "top" || side === "bottom") {
		if (alignment === "start") {
			x = referenceRect.left
		}

		if (alignment === "center") {
			x = referenceRect.left + referenceRect.width / 2 - floatingRect.width / 2
		}

		if (alignment === "end") {
			x = referenceRect.right - floatingRect.width
		}
	}

	if (side === "left" || side === "right") {
		if (alignment === "start") {
			y = referenceRect.top
		}

		if (alignment === "center") {
			y = referenceRect.top + referenceRect.height / 2 - floatingRect.height / 2
		}

		if (alignment === "end") {
			y = referenceRect.bottom - floatingRect.height
		}
	}

	return {
		x,
		y,
	}
}
