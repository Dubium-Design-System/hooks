import type { ReactNode, RefCallback } from "react"

/**
 * Точка с координатами [x, y].
 */
export type TPoint = [number, number]

/**
 * Источник активации безопасной зоны: container или target.
 */
export type THoverSafeZoneOrigin = "container" | "target"

/**
 * Сторона расположения контейнера относительно target-элемента.
 */
export type THoverSafeZonePlacementSide = "bottom" | "left" | "right" | "top"

/**
 * Тип указателя для отслеживания в безопасной зоне.
 */
export type THoverSafeZonePointerType = "mouse" | "pen" | "touch"

/**
 * Координаты указателя.
 */
export interface IPointerCoordinates {
	clientX: number
	clientY: number
}

/**
 * Прямоугольная область.
 */
export interface IRectLike {
	bottom: number
	height: number
	left: number
	right: number
	top: number
	width: number
}

/**
 * Четыре угла прямоугольника.
 */
export interface IRectPoints {
	bottomLeft: TPoint
	bottomRight: TPoint
	topLeft: TPoint
	topRight: TPoint
}

/**
 * Границы оверлея безопасной зоны.
 */
export interface IHoverSafeZoneOverlayBounds {
	height: number
	left: number
	top: number
	width: number
}

/**
 * Состояние оверлея безопасной зоны.
 */
export interface IHoverSafeZoneOverlayState {
	/** Границы оверлея. */
	bounds: IHoverSafeZoneOverlayBounds
	/** SVG path безопасной зоны. */
	safeZonePath: string
}

/**
 * Опции хука `useHoverSafeZoneArea`.
 */
export interface IUseHoverSafeZoneAreaOptions {
	/** Флаг активности логики безопасной зоны. */
	isActive: boolean
	/** При `true` отключает все взаимодействия безопасной зоны. */
	isDisabled?: boolean
	/** Колбэк при запросе закрытия. */
	onRequestClose?: VoidFunction
	/** Колбэк при входе указателя в safe-zone path. */
	onSafeZoneEnter?: VoidFunction
	/** Колбэк при движении указателя внутри safe-zone path. */
	onSafeZoneMove?: VoidFunction
	/** Колбэк при закрытии по таймауту safe-zone. */
	onTimeout?: VoidFunction
	/** Отступ вокруг target/container. По умолчанию `16`. */
	padding?: number
	/** Типы указателя, для которых работает safe-zone. По умолчанию только `mouse`. */
	pointerTypes?: THoverSafeZonePointerType[]
	/** Время до авто-закрытия safe-zone. По умолчанию `1500`. */
	timeout?: number
}

/**
 * Возвращаемое значение хука `useHoverSafeZoneArea`.
 */
export interface IUseHoverSafeZoneAreaResult {
	/** Ref callback для container-элемента. */
	containerRef: RefCallback<HTMLElement>
	/** Ref callback для target-элемента. */
	targetRef: RefCallback<HTMLElement>
}

/**
 * Свойства, передаваемые в render-prop функцию компонента HoverSafeZoneArea.
 */
export interface IHoverSafeZoneAreaChildrenProps {
	/** Ref callback для container-элемента. */
	containerRef: RefCallback<HTMLElement>
	/** Ref callback для target-элемента. */
	targetRef: RefCallback<HTMLElement>
}

/**
 * Свойства компонента HoverSafeZoneArea.
 */
export interface IHoverSafeZoneAreaProps extends IUseHoverSafeZoneAreaOptions {
	/** Render-prop функция, получающая ref-ы для target и container. */
	children: (props: IHoverSafeZoneAreaChildrenProps) => ReactNode
}
