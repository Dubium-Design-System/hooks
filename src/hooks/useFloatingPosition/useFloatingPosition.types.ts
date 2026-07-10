import type { CSSProperties, RefCallback } from "react"

/**
 * Сторона расположения floating-элемента относительно reference-элемента.
 */
export type FloatingSide = "bottom" | "left" | "right" | "top"

/**
 * Выравнивание floating-элемента относительно reference-элемента.
 */
export type FloatingAlignment = "center" | "end" | "start"

/**
 * Полное описание расположения floating-элемента.
 */
export type FloatingPlacement = `${FloatingSide}-end` | `${FloatingSide}-start` | FloatingSide

/**
 * CSS-стратегия позиционирования floating-элемента.
 */
export type FloatingStrategy = "absolute" | "fixed"

/**
 * Распарсенное расположение floating-элемента.
 */
export interface FloatingParsedPlacement {
	/** Выравнивание относительно reference-элемента. */
	alignment: FloatingAlignment
	/** Сторона расположения. */
	side: FloatingSide
}

/**
 * Координаты floating-элемента.
 */
export interface FloatingCoords {
	/** Координата по горизонтали. */
	x: number
	/** Координата по вертикали. */
	y: number
}

/**
 * Описание прямоугольника viewport.
 */
export interface FloatingViewportRect {
	bottom: number
	height: number
	left: number
	right: number
	top: number
	width: number
}

/**
 * Доступное место вокруг reference-элемента.
 */
export interface FloatingAvailableSpace {
	bottom: number
	left: number
	right: number
	top: number
}

/**
 * Опции, нормализованные внутри хука.
 */
export interface FloatingResolvedOptions {
	flip: boolean
	hideWhenReferenceHidden: boolean
	maxHeight: boolean | number
	offset: number
	padding: number
	placement: FloatingPlacement
	sameWidth: boolean
	shift: boolean
	strategy: FloatingStrategy
	zIndex?: number
}

/**
 * Результат вычисления позиции floating-элемента.
 */
export interface FloatingPositionResult {
	/** Доступная высота для floating-элемента. */
	availableHeight: null | number
	/** Флаг, что reference-элемент не виден во viewport. */
	isReferenceHidden: boolean
	/** Итоговое расположение после применения flip. */
	placement: FloatingPlacement
	/** Inline-style для floating-элемента. */
	style: CSSProperties
	/** Итоговая координата по горизонтали. */
	x: number
	/** Итоговая координата по вертикали. */
	y: number
}

/**
 * Опции хука позиционирования floating-элемента.
 */
export interface UseFloatingPositionOptions {
	/** Флаг автоматического обновления позиции. */
	autoUpdate?: boolean
	/** Флаг переворота на противоположную сторону при нехватке места. */
	flip?: boolean
	/** Флаг скрытия floating-элемента, если reference ушёл из viewport. */
	hideWhenReferenceHidden?: boolean
	/** Флаг полного отключения хука. */
	isDisabled?: boolean
	/** Флаг открытого состояния floating-элемента. */
	isOpen?: boolean
	/** Флаг или числовой лимит максимальной высоты floating-элемента. */
	maxHeight?: boolean | number
	/** Отступ между reference и floating-элементом. */
	offset?: number
	/** Callback после каждого успешного пересчёта позиции. */
	onPositionChange?: (result: FloatingPositionResult) => void
	/** Callback при первом обнаружении скрытого reference-элемента. */
	onReferenceHidden?: VoidFunction
	/** Минимальный отступ от границ viewport. */
	padding?: number
	/** Предпочитаемое расположение floating-элемента. */
	placement?: FloatingPlacement
	/** Флаг выставления ширины floating-элемента по ширине reference. */
	sameWidth?: boolean
	/** Флаг сдвига floating-элемента внутрь viewport. */
	shift?: boolean
	/** CSS-стратегия позиционирования. */
	strategy?: FloatingStrategy
	/** z-index floating-элемента. */
	zIndex?: number
}

/**
 * Возвращаемое значение хука позиционирования floating-элемента.
 */
export interface UseFloatingPositionReturn<
	TReference extends HTMLElement = HTMLElement,
	TFloating extends HTMLElement = HTMLElement,
> {
	/** Текущий floating-элемент. */
	floatingElement: null | TFloating
	/** Ref callback для floating-элемента. */
	floatingRef: RefCallback<TFloating>
	/** Inline-style для floating-элемента. */
	floatingStyle: CSSProperties
	/** Немедленно пересчитать позицию. */
	forceUpdate: VoidFunction
	/** Флаг, что reference-элемент скрыт за пределами viewport. */
	isReferenceHidden: boolean
	/** Итоговое расположение floating-элемента. */
	placement: FloatingPlacement
	/** Текущий reference-элемент. */
	referenceElement: null | TReference
	/** Ref callback для reference-элемента. */
	referenceRef: RefCallback<TReference>
	/** Запланировать обновление позиции через requestAnimationFrame. */
	update: VoidFunction
}
