/**
 * Модуль позиционирования floating-элементов.
 *
 * Предоставляет хук `useFloatingPosition` для расчёта координат
 * всплывающих элементов относительно reference-элементов с поддержкой
 * flip, shift, offset, sameWidth, maxHeight и автообновления.
 */

export { useFloatingPosition } from "./useFloatingPosition"

export type {
	FloatingAlignment,
	FloatingAvailableSpace,
	FloatingCoords,
	FloatingParsedPlacement,
	FloatingPlacement,
	FloatingPositionResult,
	FloatingSide,
	FloatingStrategy,
	FloatingViewportRect,
	UseFloatingPositionOptions,
	UseFloatingPositionReturn,
} from "./useFloatingPosition.types"
