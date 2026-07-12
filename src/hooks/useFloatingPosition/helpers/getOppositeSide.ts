import type { TFloatingSide } from "../useFloatingPosition.types"

/**
 * Возвращает противоположную сторону для placement.
 *
 * @param side - Исходная сторона.
 * @returns Противоположная сторона.
 */
export const getOppositeSide = (side: TFloatingSide): TFloatingSide => {
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
