import type { FloatingPositionResult, FloatingResolvedOptions } from "../useFloatingPosition.types"

import { getAvailableHeight } from "../helpers/getAvailableHeight"
import { getAvailableSpace } from "../helpers/getAvailableSpace"
import { getBaseFloatingCoords } from "../helpers/getBaseFloatingCoords"
import { getFlippedPlacement } from "../helpers/getFlippedPlacement"
import { getShiftedFloatingCoords } from "../helpers/getShiftedFloatingCoords"
import { getViewportRect } from "../helpers/getViewportRect"
import { isRectVisible } from "../helpers/isRectVisible"

interface ComputeFloatingPositionParams {
	/** Floating-элемент, позицию которого нужно рассчитать. */
	floatingElement: HTMLElement
	/** Нормализованные опции позиционирования. */
	options: FloatingResolvedOptions
	/** Reference-элемент, относительно которого позиционируется floating. */
	referenceElement: HTMLElement
}

/**
 * Создаёт rect floating-элемента с учётом sameWidth.
 * Если включён sameWidth, ширина floating-элемента приравнивается к ширине reference.
 *
 * @param floatingRect - Исходный rect floating-элемента.
 * @param referenceRect - Rect reference-элемента.
 * @param sameWidth - Флаг выравнивания ширины.
 * @returns Rect для расчётов позиционирования.
 */
const getFloatingRectForCompute = (floatingRect: DOMRect, referenceRect: DOMRect, sameWidth: boolean): DOMRect => {
	if (!sameWidth) {
		return floatingRect
	}

	return DOMRect.fromRect({
		x: floatingRect.x,
		y: floatingRect.y,
		width: referenceRect.width,
		height: floatingRect.height,
	})
}

/**
 * Вычисляет позицию floating-элемента относительно reference-элемента.
 *
 * @param params - Параметры расчёта позиции.
 * @returns Результат позиционирования и inline-style.
 */
export const computeFloatingPosition = ({
	floatingElement,
	options,
	referenceElement,
}: ComputeFloatingPositionParams): FloatingPositionResult => {
	const referenceRect = referenceElement.getBoundingClientRect()
	const measuredFloatingRect = floatingElement.getBoundingClientRect()
	const floatingRect = getFloatingRectForCompute(measuredFloatingRect, referenceRect, options.sameWidth)
	const viewportRect = getViewportRect()

	const availableSpace = getAvailableSpace({
		padding: options.padding,
		referenceRect,
		viewportRect,
	})

	const isReferenceHidden = !isRectVisible(referenceRect, viewportRect)

	const placement = getFlippedPlacement({
		availableSpace,
		flip: options.flip,
		floatingRect,
		offset: options.offset,
		placement: options.placement,
	})

	const baseCoords = getBaseFloatingCoords({
		floatingRect,
		offset: options.offset,
		placement,
		referenceRect,
	})

	const shiftedCoords = getShiftedFloatingCoords({
		coords: baseCoords,
		floatingRect,
		padding: options.padding,
		shift: options.shift,
		viewportRect,
	})

	const scrollX = options.strategy === "absolute" ? window.scrollX : 0
	const scrollY = options.strategy === "absolute" ? window.scrollY : 0

	const x = Math.round(shiftedCoords.x + scrollX)
	const y = Math.round(shiftedCoords.y + scrollY)

	const availableHeight = getAvailableHeight({
		maxHeight: options.maxHeight,
		offset: options.offset,
		padding: options.padding,
		placement,
		referenceRect,
		viewportRect,
	})

	const shouldHide = options.hideWhenReferenceHidden && isReferenceHidden

	const style: FloatingPositionResult["style"] = {
		left: x,
		position: options.strategy,
		top: y,
		visibility: shouldHide ? "hidden" : "visible",
	}

	if (options.zIndex !== undefined) {
		style.zIndex = options.zIndex
	}

	if (options.sameWidth) {
		style.width = Math.round(referenceRect.width)
	}

	if (availableHeight !== null) {
		style.maxHeight = availableHeight
		style.overflowY = "auto"
	}

	if (shouldHide) {
		style.pointerEvents = "none"
	}

	return {
		availableHeight,
		isReferenceHidden,
		placement,
		style,
		x,
		y,
	}
}
