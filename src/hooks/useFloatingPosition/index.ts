/**
 * Модуль позиционирования floating-элементов.
 *
 * Предоставляет хук `useFloatingPosition` для расчёта координат
 * всплывающих элементов относительно reference-элементов с поддержкой
 * flip, shift, offset, sameWidth, maxHeight и автообновления.
 */

export { useFloatingPosition } from "./useFloatingPosition"

export type {
	IFloatingAvailableSpace,
	IFloatingCoords,
	IFloatingParsedPlacement,
	IFloatingPositionResult,
	IFloatingViewportRect,
	IUseFloatingPositionOptions,
	IUseFloatingPositionReturn,
	TFloatingAlignment,
	TFloatingPlacement,
	TFloatingSide,
} from "./useFloatingPosition.types"
