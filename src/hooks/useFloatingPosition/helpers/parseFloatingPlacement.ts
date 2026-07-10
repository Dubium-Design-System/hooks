import type { FloatingParsedPlacement, FloatingPlacement, FloatingSide } from "../useFloatingPosition.types"

/**
 * Разбирает placement на сторону и выравнивание.
 *
 * @param placement - Полное описание расположения floating-элемента.
 * @returns Сторона и выравнивание.
 */
export const parseFloatingPlacement = (placement: FloatingPlacement): FloatingParsedPlacement => {
	const [side, alignment] = placement.split("-") as [FloatingSide, "end" | "start" | undefined]

	return {
		alignment: alignment ?? "center",
		side,
	}
}

/**
 * Собирает placement из стороны и выравнивания.
 *
 * @param side - Сторона расположения.
 * @param alignment - Выравнивание относительно reference-элемента.
 * @returns Полное описание расположения floating-элемента.
 */
export const createFloatingPlacement = (
	side: FloatingSide,
	alignment: FloatingParsedPlacement["alignment"],
): FloatingPlacement => {
	if (alignment === "center") {
		return side
	}

	return `${side}-${alignment}`
}
