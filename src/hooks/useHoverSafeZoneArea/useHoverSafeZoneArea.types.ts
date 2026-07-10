import type { ReactNode, RefCallback } from "react"

export type Point = [number, number]
export type HoverSafeZoneOrigin = "container" | "target"
export type HoverSafeZonePlacementSide = "bottom" | "left" | "right" | "top"
export type HoverSafeZonePointerType = "mouse" | "pen" | "touch"

export interface PointerCoordinates {
	clientX: number
	clientY: number
}

export interface RectLike {
	bottom: number
	height: number
	left: number
	right: number
	top: number
	width: number
}

export interface RectPoints {
	bottomLeft: Point
	bottomRight: Point
	topLeft: Point
	topRight: Point
}

export interface HoverSafeZoneOverlayBounds {
	height: number
	left: number
	top: number
	width: number
}

export interface HoverSafeZoneOverlayState {
	bounds: HoverSafeZoneOverlayBounds
	clipPath: string
	safeZonePath: string
}

export interface UseHoverSafeZoneAreaOptions {
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
	pointerTypes?: HoverSafeZonePointerType[]
	/** Время до авто-закрытия safe-zone. По умолчанию `1500`. */
	timeout?: number
}

export interface UseHoverSafeZoneAreaResult {
	containerRef: RefCallback<HTMLElement>
	elementToRender: ReactNode
	targetRef: RefCallback<HTMLElement>
}

export interface HoverSafeZoneAreaChildrenProps {
	containerRef: RefCallback<HTMLElement>
	targetRef: RefCallback<HTMLElement>
}

export interface HoverSafeZoneAreaProps extends UseHoverSafeZoneAreaOptions {
	children: (props: HoverSafeZoneAreaChildrenProps) => ReactNode
}
