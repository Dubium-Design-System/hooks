/**
 * @packageDocumentation
 * Dubium Design System — хуки React
 *
 * Коллекция переиспользуемых React-хуков для построения UI-компонентов
 * Dubium Design System. Включает хуки для позиционирования floating-элементов,
 * безопасной зоны при наведении, отслеживания событий, управления состоянием
 * и других распространённых задач.
 */

export {
	type IUseClickOutsideOptions,
	type TClickOutsideEvent,
	type TClickOutsideEventType,
	useClickOutside,
} from "./hooks/useClickOutside"
export { type TPossibleRef, useCombinedRefs } from "./hooks/useCombinedRefs"
export { type IUseCounterOptions, type IUseCounterReturn, useCounter } from "./hooks/useCounter"
export { useDebounce } from "./hooks/useDebounce"
export { type IDebouncedFunction, useDebounceFn } from "./hooks/useDebounceFn"
export { type IUseEventListenerOptions, type TEventListenerTarget, useEventListener } from "./hooks/useEventListener"
export {
	type IFloatingPositionResult,
	type IUseFloatingPositionOptions,
	type IUseFloatingPositionReturn,
	type TFloatingPlacement,
	useFloatingPosition,
} from "./hooks/useFloatingPosition"
export { type IUseHoverOptions, type IUseHoverReturn, type THoverPointerType, useHover } from "./hooks/useHover"
export {
	HoverSafeZoneArea,
	type IHoverSafeZoneAreaChildrenProps,
	type IHoverSafeZoneAreaProps,
	type IUseHoverSafeZoneAreaOptions,
	type IUseHoverSafeZoneAreaResult,
	type THoverSafeZonePointerType,
	useHoverSafeZoneArea,
} from "./hooks/useHoverSafeZoneArea"
export {
	type IUseIntersectionObserverOptions,
	type IUseIntersectionObserverReturn,
	useIntersectionObserver,
} from "./hooks/useIntersectionObserver"
export { useMountEffect } from "./hooks/useMountEffect"
export { type IPosition, type IUseMoveOptions, type IUseMoveReturn, type TMoveMode, useMove } from "./hooks/useMove"
export {
	type INetworkState,
	type TNetworkConnectionType,
	type TNetworkEffectiveType,
	useNetworkState,
} from "./hooks/useNetworkState"
export {
	type IPinInputClearOptions,
	type IPinInputFieldProps,
	type IUsePinInputOptions,
	type IUsePinInputReturn,
	type TPinInputType,
	type TPinInputValues,
	usePinInput,
} from "./hooks/usePinInput"
export { type IUseThrottleOptions, useThrottle } from "./hooks/useThrottle"
export { useUnmountEffect } from "./hooks/useUnmountEffect"
export { useUpdateEffect } from "./hooks/useUpdateEffect"
export {
	type IScrollToIndexOptions,
	type IUseVirtualListOptions,
	type IUseVirtualListReturn,
	type IVirtualListItem,
	type TVirtualListAlign,
	useVirtualList,
} from "./hooks/useVirtualList"
export { type IWindowSize, useWindowSize } from "./hooks/useWindowSize"
