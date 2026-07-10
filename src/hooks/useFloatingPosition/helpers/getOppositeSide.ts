import type { FloatingSide } from "../useFloatingPosition.types"

/**
 * Возвращает противоположную сторону для placement.
 *
 * @param side - Исходная сторона.
 * @returns Противоположная сторона.
 */
export const getOppositeSide = (side: FloatingSide): FloatingSide => {
	if (side === "top") {
		return "bottom"
	}

	if (side === "bottom") {
		return "top"
	}

	if (side === "left") {
		return "right"
	}

	return "left"
}
