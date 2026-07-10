import type { FloatingAvailableSpace, FloatingPlacement } from "../useFloatingPosition.types"

import { getOppositeSide } from "./getOppositeSide"
import { createFloatingPlacement, parseFloatingPlacement } from "./parseFloatingPlacement"

interface GetFlippedPlacementParams {
	/** Доступное пространство вокруг reference-элемента. */
	availableSpace: FloatingAvailableSpace
	/** Флаг переворота на противоположную сторону. */
	flip: boolean
	/** Прямоугольник floating-элемента. */
	floatingRect: DOMRect
	/** Отступ между reference и floating-элементом. */
	offset: number
	/** Предпочитаемое расположение floating-элемента. */
	placement: FloatingPlacement
}

/**
 * Возвращает итоговый placement с учётом flip-логики.
 *
 * @param params - Параметры расчёта flip.
 * @returns Исходный или перевёрнутый placement.
 */
export const getFlippedPlacement = ({
	availableSpace,
	flip,
	floatingRect,
	offset,
	placement,
}: GetFlippedPlacementParams): FloatingPlacement => {
	if (!flip) {
		return placement
	}

	const { alignment, side } = parseFloatingPlacement(placement)

	const requiredSpace =
		side === "top" || side === "bottom" ? floatingRect.height + offset : floatingRect.width + offset

	if (availableSpace[side] >= requiredSpace) {
		return placement
	}

	const oppositeSide = getOppositeSide(side)

	if (availableSpace[oppositeSide] <= availableSpace[side]) {
		return placement
	}

	return createFloatingPlacement(oppositeSide, alignment)
}
