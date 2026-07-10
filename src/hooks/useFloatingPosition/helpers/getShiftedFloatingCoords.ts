import type { FloatingCoords, FloatingViewportRect } from "../useFloatingPosition.types"

interface GetShiftedFloatingCoordsParams {
	/** Исходные координаты floating-элемента. */
	coords: FloatingCoords
	/** Прямоугольник floating-элемента. */
	floatingRect: DOMRect
	/** Минимальный отступ от границ viewport. */
	padding: number
	/** Флаг сдвига floating-элемента внутрь viewport. */
	shift: boolean
	/** Прямоугольник viewport. */
	viewportRect: FloatingViewportRect
}

/**
 * Ограничивает значение диапазоном [min, max].
 *
 * @param value - Исходное значение.
 * @param min - Минимальное значение.
 * @param max - Максимальное значение.
 * @returns Значение внутри диапазона.
 */
const clamp = (value: number, min: number, max: number): number => {
	if (value < min) {
		return min
	}

	if (value > max) {
		return max
	}

	return value
}

/**
 * Сдвигает floating-элемент так, чтобы он не выходил за границы viewport.
 *
 * @param params - Параметры сдвига.
 * @returns Координаты после применения shift.
 */
export const getShiftedFloatingCoords = ({
	coords,
	floatingRect,
	padding,
	shift,
	viewportRect,
}: GetShiftedFloatingCoordsParams): FloatingCoords => {
	if (!shift) {
		return coords
	}

	const minX = viewportRect.left + padding
	const maxX = viewportRect.right - floatingRect.width - padding

	const minY = viewportRect.top + padding
	const maxY = viewportRect.bottom - floatingRect.height - padding

	return {
		x: clamp(coords.x, minX, Math.max(minX, maxX)),
		y: clamp(coords.y, minY, Math.max(minY, maxY)),
	}
}
