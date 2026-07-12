import type {
	IHoverSafeZoneOverlayState,
	IPointerCoordinates,
	IRectLike,
	IRectPoints,
	THoverSafeZoneOrigin,
	THoverSafeZonePlacementSide,
	TPoint,
} from "../useHoverSafeZoneArea.types"

/**
 * Извлекает координаты указателя из события в формате Point [x, y].
 *
 * @param event - Событие указателя.
 * @returns Точка [clientX, clientY].
 */
export const getPoint = (event: Pick<PointerEvent, "clientX" | "clientY">): TPoint => {
	return [event.clientX, event.clientY]
}

/**
 * Извлекает координаты указателя из события в формате PointerCoordinates.
 *
 * @param event - Событие указателя.
 * @returns Объект с clientX и clientY.
 */
export const getPointerCoordinates = (event: Pick<PointerEvent, "clientX" | "clientY">): IPointerCoordinates => ({
	clientX: event.clientX,
	clientY: event.clientY,
})

/**
 * Проверяет, находится ли точка внутри прямоугольника.
 *
 * @param rect - Прямоугольник.
 * @param point - Координаты точки.
 * @returns true, если точка внутри прямоугольника.
 */
export const isPointInsideRect = (rect: DOMRect, point: IPointerCoordinates): boolean => {
	return (
		point.clientX >= rect.left &&
		point.clientX <= rect.right &&
		point.clientY >= rect.top &&
		point.clientY <= rect.bottom
	)
}

/**
 * Проверяет, находится ли точка внутри DOM-элемента.
 *
 * @param element - DOM-элемент.
 * @param point - Координаты точки.
 * @returns true, если точка внутри элемента.
 */
export const isPointInsideElement = (element: HTMLElement, point: IPointerCoordinates): boolean => {
	return isPointInsideRect(element.getBoundingClientRect(), point)
}

/**
 * Проверяет, находится ли точка внутри элемента с учётом отступа.
 *
 * @param element - DOM-элемент.
 * @param point - Координаты точки.
 * @param padding - Отступ от границ элемента.
 * @returns true, если точка внутри расширенной области элемента.
 */
export const isPointInsideExpandedElement = (
	element: HTMLElement,
	point: IPointerCoordinates,
	padding: number,
): boolean => {
	const rect = element.getBoundingClientRect()

	return (
		point.clientX >= rect.left - padding &&
		point.clientX <= rect.right + padding &&
		point.clientY >= rect.top - padding &&
		point.clientY <= rect.bottom + padding
	)
}

/**
 * Расширяет прямоугольник на указанный отступ со всех сторон.
 *
 * @param rect - Исходный прямоугольник.
 * @param padding - Отступ.
 * @returns Расширенный прямоугольник.
 */
export const expandRect = (rect: DOMRect, padding: number): IRectLike => ({
	top: rect.top - padding,
	right: rect.right + padding,
	bottom: rect.bottom + padding,
	left: rect.left - padding,
	width: rect.width + padding * 2,
	height: rect.height + padding * 2,
})

/**
 * Возвращает четыре угла прямоугольника относительно смещения.
 *
 * @param rect - Прямоугольник.
 * @param offsetLeft - Смещение по горизонтали.
 * @param offsetTop - Смещение по вертикали.
 * @returns Углы прямоугольника.
 */
export const getRelativeRectPoints = (rect: IRectLike, offsetLeft: number, offsetTop: number): IRectPoints => ({
	topLeft: [rect.left - offsetLeft, rect.top - offsetTop],
	topRight: [rect.right - offsetLeft, rect.top - offsetTop],
	bottomRight: [rect.right - offsetLeft, rect.bottom - offsetTop],
	bottomLeft: [rect.left - offsetLeft, rect.bottom - offsetTop],
})

/**
 * Создаёт SVG path для многоугольника по точкам.
 *
 * @param firstPoint - Первая точка (начало).
 * @param restPoints - Остальные точки.
 * @returns Строка SVG path.
 */
export const createPolygonPath = (firstPoint: TPoint, ...restPoints: TPoint[]): string => {
	const restPath = restPoints.map((point) => `L ${point[0]} ${point[1]}`).join(" ")

	return `M ${firstPoint[0]} ${firstPoint[1]} ${restPath} Z`
}

/**
 * Возвращает центр прямоугольника.
 *
 * @param rect - Прямоугольник.
 * @returns Координаты центра.
 */
const getRectCenter = (rect: DOMRect) => ({
	x: rect.left + rect.width / 2,
	y: rect.top + rect.height / 2,
})

/**
 * Определяет, с какой стороны контейнер расположен относительно target-элемента.
 *
 * @param targetRect - Прямоугольник target-элемента.
 * @param containerRect - Прямоугольник container-элемента.
 * @returns Сторона расположения контейнера.
 */
export const getFloatingPlacementSide = (targetRect: DOMRect, containerRect: DOMRect): THoverSafeZonePlacementSide => {
	if (containerRect.left >= targetRect.right) {
		return "right"
	}

	if (containerRect.right <= targetRect.left) {
		return "left"
	}

	if (containerRect.top >= targetRect.bottom) {
		return "bottom"
	}

	if (containerRect.bottom <= targetRect.top) {
		return "top"
	}

	const targetCenter = getRectCenter(targetRect)
	const containerCenter = getRectCenter(containerRect)
	const deltaX = containerCenter.x - targetCenter.x
	const deltaY = containerCenter.y - targetCenter.y

	if (Math.abs(deltaX) >= Math.abs(deltaY)) {
		if (deltaX >= 0) {
			return "right"
		}

		return "left"
	}

	if (deltaY >= 0) {
		return "bottom"
	}

	return "top"
}

/**
 * Проверяет, находится ли точка в вертикальном диапазоне прямоугольника с учётом отступа.
 *
 * @param rect - Прямоугольник.
 * @param point - Координаты точки.
 * @param padding - Отступ.
 * @returns true, если точка в вертикальном диапазоне.
 */
const isPointInVerticalRange = (rect: DOMRect, point: IPointerCoordinates, padding: number): boolean => {
	return point.clientY >= rect.top - padding && point.clientY <= rect.bottom + padding
}

/**
 * Проверяет, находится ли точка в горизонтальном диапазоне прямоугольника с учётом отступа.
 *
 * @param rect - Прямоугольник.
 * @param point - Координаты точки.
 * @param padding - Отступ.
 * @returns true, если точка в горизонтальном диапазоне.
 */
const isPointInHorizontalRange = (rect: DOMRect, point: IPointerCoordinates, padding: number): boolean => {
	return point.clientX >= rect.left - padding && point.clientX <= rect.right + padding
}

/**
 * Проверяет, находится ли точка рядом со стороной target-элемента,
 * обращённой к контейнеру.
 *
 * @param params - Параметры проверки.
 * @returns true, если точка рядом с указанной стороной.
 */
export const isPointNearTargetSideFacingContainer = ({
	targetRect,
	placementSide,
	point,
	padding,
}: {
	padding: number
	placementSide: THoverSafeZonePlacementSide
	point: IPointerCoordinates
	targetRect: DOMRect
}): boolean => {
	if (placementSide === "right") {
		return point.clientX >= targetRect.right - padding && isPointInVerticalRange(targetRect, point, padding)
	}

	if (placementSide === "left") {
		return point.clientX <= targetRect.left + padding && isPointInVerticalRange(targetRect, point, padding)
	}

	if (placementSide === "bottom") {
		return point.clientY >= targetRect.bottom - padding && isPointInHorizontalRange(targetRect, point, padding)
	}

	return point.clientY <= targetRect.top + padding && isPointInHorizontalRange(targetRect, point, padding)
}

/**
 * Проверяет, находится ли точка рядом со стороной контейнера,
 * обращённой к target-элементу.
 *
 * @param params - Параметры проверки.
 * @returns true, если точка рядом с указанной стороной.
 */
export const isPointNearContainerSideFacingTarget = ({
	containerRect,
	placementSide,
	point,
	padding,
}: {
	containerRect: DOMRect
	padding: number
	placementSide: THoverSafeZonePlacementSide
	point: IPointerCoordinates
}): boolean => {
	if (placementSide === "right") {
		return point.clientX <= containerRect.left + padding && isPointInVerticalRange(containerRect, point, padding)
	}

	if (placementSide === "left") {
		return point.clientX >= containerRect.right - padding && isPointInVerticalRange(containerRect, point, padding)
	}

	if (placementSide === "bottom") {
		return point.clientY <= containerRect.top + padding && isPointInHorizontalRange(containerRect, point, padding)
	}

	return point.clientY >= containerRect.bottom - padding && isPointInHorizontalRange(containerRect, point, padding)
}

/**
 * Создаёт SVG path для безопасной зоны между указателем и контейнером.
 *
 * @param params - Параметры: позиция мыши и углы контейнера.
 * @returns Строка SVG path, состоящая из четырёх треугольников.
 */
export const createSafeZonePath = ({ mouse, container }: { container: IRectPoints; mouse: TPoint }) => {
	return [
		createPolygonPath(mouse, container.topLeft, container.topRight),
		createPolygonPath(mouse, container.topRight, container.bottomRight),
		createPolygonPath(mouse, container.bottomRight, container.bottomLeft),
		createPolygonPath(mouse, container.bottomLeft, container.topLeft),
	].join(" ")
}

/**
 * Вычисляет общие границы оверлея, охватывающие target и container с отступом.
 *
 * @param targetRect - Прямоугольник target-элемента.
 * @param containerRect - Прямоугольник container-элемента.
 * @param padding - Отступ от границ.
 * @returns Прямоугольник, объединяющий оба элемента с отступом.
 */
const getOverlayBounds = (targetRect: DOMRect, containerRect: DOMRect, padding: number): IRectLike => {
	const top = Math.min(targetRect.top, containerRect.top) - padding
	const left = Math.min(targetRect.left, containerRect.left) - padding
	const bottom = Math.max(targetRect.bottom, containerRect.bottom) + padding
	const right = Math.max(targetRect.right, containerRect.right) + padding

	return {
		top,
		left,
		bottom,
		right,
		width: right - left,
		height: bottom - top,
	}
}

/**
 * Результат построения оверлея безопасной зоны.
 */
export interface ISafeZoneOverlayBuildResult {
	/** Прямоугольник container-элемента. */
	containerRect: DOMRect
	/** Источник активации safe-zone. */
	origin: THoverSafeZoneOrigin
	/** Состояние оверлея. */
	overlayState: IHoverSafeZoneOverlayState
	/** Сторона расположения контейнера относительно target. */
	placementSide: THoverSafeZonePlacementSide
	/** Позиция мыши относительно границ оверлея. */
	relativeMouse: TPoint
	/** Прямоугольник target-элемента. */
	targetRect: DOMRect
}

/**
 * Создаёт состояние оверлея безопасной зоны между target и container.
 *
 * @param params - Параметры построения оверлея.
 * @returns Состояние оверлея или null, если размеры некорректны.
 */
export const createSafeZoneOverlayState = ({
	targetElement,
	containerElement,
	padding,
	mouse,
	origin,
}: {
	containerElement: HTMLElement
	mouse: TPoint
	origin: THoverSafeZoneOrigin
	padding: number
	targetElement: HTMLElement
}): ISafeZoneOverlayBuildResult | null => {
	const targetRect = targetElement.getBoundingClientRect()
	const containerRect = containerElement.getBoundingClientRect()
	const bounds = getOverlayBounds(targetRect, containerRect, padding)

	if (bounds.width <= 0 || bounds.height <= 0) {
		return null
	}

	const destinationRect = origin === "target" ? containerRect : targetRect
	const paddedDestinationRect = expandRect(destinationRect, padding)
	const destination = getRelativeRectPoints(paddedDestinationRect, bounds.left, bounds.top)
	const placementSide = getFloatingPlacementSide(targetRect, containerRect)
	const relativeMouse: TPoint = [mouse[0] - bounds.left, mouse[1] - bounds.top]

	return {
		targetRect,
		containerRect,
		origin,
		placementSide,
		relativeMouse,
		overlayState: {
			bounds: {
				top: bounds.top,
				left: bounds.left,
				width: bounds.width,
				height: bounds.height,
			},
			safeZonePath: createSafeZonePath({
				mouse: relativeMouse,
				container: destination,
			}),
		},
	}
}

/**
 * Проверяет, находится ли точка внутри границ оверлея.
 *
 * @param overlayState - Состояние оверлея.
 * @param point - Координаты точки.
 * @returns true, если точка внутри границ.
 */
export const isPointInsideOverlayBounds = (
	overlayState: IHoverSafeZoneOverlayState,
	point: IPointerCoordinates,
): boolean => {
	return (
		point.clientX >= overlayState.bounds.left &&
		point.clientX <= overlayState.bounds.left + overlayState.bounds.width &&
		point.clientY >= overlayState.bounds.top &&
		point.clientY <= overlayState.bounds.top + overlayState.bounds.height
	)
}

/**
 * Сравнивает два состояния оверлея на идентичность.
 *
 * @param currentOverlayState - Текущее состояние.
 * @param nextOverlayState - Новое состояние.
 * @returns true, если состояния идентичны.
 */
export const isSameOverlayState = (
	currentOverlayState: IHoverSafeZoneOverlayState | null,
	nextOverlayState: IHoverSafeZoneOverlayState | null,
): boolean => {
	if (currentOverlayState === nextOverlayState) {
		return true
	}

	if (!currentOverlayState || !nextOverlayState) {
		return false
	}

	return (
		currentOverlayState.safeZonePath === nextOverlayState.safeZonePath &&
		currentOverlayState.bounds.top === nextOverlayState.bounds.top &&
		currentOverlayState.bounds.left === nextOverlayState.bounds.left &&
		currentOverlayState.bounds.width === nextOverlayState.bounds.width &&
		currentOverlayState.bounds.height === nextOverlayState.bounds.height
	)
}

/**
 * Проверяет, находится ли точка внутри SVG path с учётом трансформации.
 *
 * @param params - Параметры: SVG-элемент, path-элемент и координаты точки.
 * @returns true, если точка внутри path.
 */
export const isPointInsideSvgPath = ({
	svgElement,
	pathElement,
	point,
}: {
	pathElement: SVGPathElement
	point: IPointerCoordinates
	svgElement: SVGSVGElement
}): boolean => {
	try {
		const screenCTM = svgElement.getScreenCTM()

		if (!screenCTM) {
			return false
		}

		const svgPoint = svgElement.createSVGPoint()
		svgPoint.x = point.clientX
		svgPoint.y = point.clientY

		const localPoint = svgPoint.matrixTransform(screenCTM.inverse())

		return pathElement.isPointInFill(localPoint) || pathElement.isPointInStroke(localPoint)
	} catch {
		return false
	}
}
