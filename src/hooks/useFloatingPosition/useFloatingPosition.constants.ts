import type { CSSProperties } from "react"

import type { FloatingPlacement, FloatingStrategy } from "./useFloatingPosition.types"

/**
 * Стандартное расположение floating-элемента относительно reference-элемента.
 */
export const DEFAULT_FLOATING_PLACEMENT: FloatingPlacement = "bottom-start"

/**
 * Стратегия позиционирования по умолчанию.
 */
export const DEFAULT_FLOATING_STRATEGY: FloatingStrategy = "fixed"

/**
 * Стандартный отступ между reference и floating-элементом.
 */
export const DEFAULT_FLOATING_OFFSET = 4

/**
 * Стандартный внутренний отступ от границ viewport.
 */
export const DEFAULT_FLOATING_PADDING = 8

/**
 * Флаг автоматического переворота floating-элемента при нехватке места.
 */
export const DEFAULT_FLOATING_FLIP = true

/**
 * Флаг автоматического сдвига floating-элемента в границы viewport.
 */
export const DEFAULT_FLOATING_SHIFT = true

/**
 * Флаг выравнивания ширины floating-элемента по ширине reference.
 */
export const DEFAULT_FLOATING_SAME_WIDTH = false

/**
 * Флаг автоматического ограничения высоты floating-элемента.
 */
export const DEFAULT_FLOATING_MAX_HEIGHT = false

/**
 * Флаг скрытия floating-элемента, если reference ушёл из viewport.
 */
export const DEFAULT_FLOATING_HIDE_WHEN_REFERENCE_HIDDEN = true

/**
 * Флаг автоматического обновления позиции при scroll/resize/изменении размеров.
 */
export const DEFAULT_FLOATING_AUTO_UPDATE = true

/**
 * Начальный стиль floating-элемента до первого расчёта позиции.
 */
export const DEFAULT_FLOATING_STYLE: CSSProperties = {
	left: 0,
	position: DEFAULT_FLOATING_STRATEGY,
	top: 0,
	visibility: "hidden",
}
