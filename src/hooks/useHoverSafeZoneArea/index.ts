/**
 * Модуль безопасной зоны при наведении (hover safe zone).
 *
 * Предоставляет компонент `HoverSafeZoneArea` и хук `useHoverSafeZoneArea`
 * для создания невидимой области между target- и container-элементами,
 * предотвращающей ложное закрытие всплывающих элементов при перемещении
 * указателя между ними.
 */

export { HoverSafeZoneArea } from "./components/HoverSafeZoneArea"
export { useHoverSafeZoneArea } from "./hooks/useHoverSafeZoneArea"

export type {
	HoverSafeZoneAreaChildrenProps,
	HoverSafeZoneAreaProps,
	HoverSafeZoneOrigin,
	HoverSafeZoneOverlayState,
	HoverSafeZonePlacementSide,
	HoverSafeZonePointerType,
	Point,
	PointerCoordinates,
	RectLike,
	RectPoints,
	UseHoverSafeZoneAreaOptions,
	UseHoverSafeZoneAreaResult,
} from "./useHoverSafeZoneArea.types"
