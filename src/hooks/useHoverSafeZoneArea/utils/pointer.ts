import type { PointerEvent as ReactPointerEvent } from "react"

import type { HoverSafeZonePointerType, Point, PointerCoordinates } from "../useHoverSafeZoneArea.types"

import { isPointInsideElement, isPointInsideExpandedElement } from "./geometry"

/**
 * Опции для определения действия при выходе указателя.
 */
interface PointerLeaveActionOptions {
	/** Target-элемент. */
	containerElement: HTMLElement | null
	/** Отступ от границ. */
	padding: number
	/** Координаты точки. */
	point: PointerCoordinates
	/** Container-элемент. */
	targetElement: HTMLElement | null
}

/**
 * Действие при выходе указателя из safe-zone.
 * - `"target"` — указатель вошёл в target-элемент.
 * - `"container"` — указатель вошёл в container-элемент.
 * - `"expanded-container"` — указатель в расширенной области контейнера.
 * - `"outside"` — указатель за пределами всех областей.
 */
export type PointerLeaveAction = "container" | "expanded-container" | "outside" | "target"

/**
 * Проверяет, поддерживается ли тип указателя.
 *
 * @param event - Событие указателя.
 * @param pointerTypes - Список поддерживаемых типов.
 * @returns true, если тип указателя поддерживается.
 */
export const isSupportedPointerType = (
	event: Pick<PointerEvent, "pointerType"> | Pick<ReactPointerEvent<SVGPathElement>, "pointerType">,
	pointerTypes: readonly HoverSafeZonePointerType[],
): boolean => {
	if (!event.pointerType) {
		return true
	}

	return pointerTypes.includes(event.pointerType as HoverSafeZonePointerType)
}

/**
 * Определяет действие при выходе указателя из safe-zone path.
 *
 * @param params - Параметры для определения действия.
 * @returns Действие: target, container, expanded-container или outside.
 */
export const getPointerLeaveAction = ({
	targetElement,
	containerElement,
	point,
	padding,
}: PointerLeaveActionOptions): PointerLeaveAction => {
	if (targetElement && isPointInsideElement(targetElement, point)) {
		return "target"
	}

	if (containerElement && isPointInsideElement(containerElement, point)) {
		return "container"
	}

	if (containerElement && isPointInsideExpandedElement(containerElement, point, padding)) {
		return "expanded-container"
	}

	return "outside"
}

/**
 * Извлекает координаты указателя из React-события.
 *
 * @param event - React-событие указателя.
 * @returns Объект с точкой и координатами.
 */
export const getReactPointerData = (event: ReactPointerEvent<SVGPathElement>) => ({
	point: {
		clientX: event.clientX,
		clientY: event.clientY,
	},
	mouse: [event.clientX, event.clientY] as Point,
})
