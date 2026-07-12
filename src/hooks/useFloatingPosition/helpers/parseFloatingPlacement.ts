import type { IFloatingParsedPlacement, TFloatingPlacement, TFloatingSide } from "../useFloatingPosition.types"

/**
 * Разбирает placement на сторону и выравнивание.
 *
 * @param placement - Полное описание расположения floating-элемента.
 * @returns Сторона и выравнивание.
 */
export const parseFloatingPlacement = (placement: TFloatingPlacement): IFloatingParsedPlacement => {
	const [side, alignment] = placement.split("-") as [TFloatingSide, "end" | "start" | undefined]

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
	side: TFloatingSide,
	alignment: IFloatingParsedPlacement["alignment"],
): TFloatingPlacement => {
	if (alignment === "center") {
		return side
	}

	return `${side}-${alignment}`
}
