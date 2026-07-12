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
	IHoverSafeZoneAreaChildrenProps,
	IHoverSafeZoneAreaProps,
	IHoverSafeZoneOverlayState,
	IPointerCoordinates,
	IRectLike,
	IRectPoints,
	IUseHoverSafeZoneAreaOptions,
	IUseHoverSafeZoneAreaResult,
	THoverSafeZoneOrigin,
	THoverSafeZonePlacementSide,
	THoverSafeZonePointerType,
	TPoint,
} from "./useHoverSafeZoneArea.types"
