import type { THoverSafeZonePointerType } from "../useHoverSafeZoneArea.types"

/**
 * Проверяет, поддерживается ли тип указателя.
 *
 * Если тип указателя не определён (например, в тестовой среде),
 * считается, что тип поддерживается.
 *
 * @param event - Событие указателя.
 * @param pointerTypes - Список поддерживаемых типов.
 * @returns `true`, если тип указателя поддерживается.
 */
export const isSupportedPointerType = (
	event: Pick<PointerEvent, "pointerType">,
	pointerTypes: readonly THoverSafeZonePointerType[],
): boolean => {
	if (!event.pointerType) {
		return true
	}

	return pointerTypes.includes(event.pointerType as THoverSafeZonePointerType)
}
