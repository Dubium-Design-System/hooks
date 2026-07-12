import type { CSSProperties, RefCallback } from "react"

/**
 * Сторона расположения floating-элемента относительно reference-элемента.
 */
export type TFloatingSide = "bottom" | "left" | "right" | "top"

/**
 * Выравнивание floating-элемента относительно reference-элемента.
 */
export type TFloatingAlignment = "center" | "end" | "start"

/**
 * Полное описание расположения floating-элемента.
 *
 * Формат: `{side}` или `{side}-{alignment}`, например `bottom-start`, `top-end`.
 */
export type TFloatingPlacement = `${TFloatingSide}-end` | `${TFloatingSide}-start` | TFloatingSide

/**
 * Распарсенное расположение floating-элемента.
 */
export interface IFloatingParsedPlacement {
	/** Выравнивание относительно reference-элемента. */
	alignment: TFloatingAlignment
	/** Сторона расположения. */
	side: TFloatingSide
}

/**
 * Координаты floating-элемента.
 */
export interface IFloatingCoords {
	/** Координата по горизонтали. */
	x: number
	/** Координата по вертикали. */
	y: number
}

/**
 * Описание прямоугольника viewport.
 */
export interface IFloatingViewportRect {
	/** Нижняя граница viewport. */
	bottom: number
	/** Высота viewport. */
	height: number
	/** Левая граница viewport. */
	left: number
	/** Правая граница viewport. */
	right: number
	/** Верхняя граница viewport. */
	top: number
	/** Ширина viewport. */
	width: number
}

/**
 * Доступное место вокруг reference-элемента.
 */
export interface IFloatingAvailableSpace extends Record<TFloatingSide, number> {
	/** Доступное пространство снизу. */
	bottom: number
	/** Доступное пространство слева. */
	left: number
	/** Доступное пространство справа. */
	right: number
	/** Доступное пространство сверху. */
	top: number
}

/**
 * Опции, нормализованные внутри хука.
 */
export interface IFloatingResolvedOptions {
	/** Флаг переворота на противоположную сторону при нехватке места. */
	flip: boolean
	/** Флаг скрытия floating-элемента, если reference ушёл из viewport. */
	hideWhenReferenceHidden: boolean
	/** Флаг или числовой лимит максимальной высоты floating-элемента. */
	maxHeight: boolean | number
	/** Отступ между reference и floating-элементом. */
	offset: number
	/** Минимальный отступ от границ viewport. */
	padding: number
	/** Предпочитаемое расположение floating-элемента. */
	placement: TFloatingPlacement
	/** Флаг выставления ширины floating-элемента по ширине reference. */
	sameWidth: boolean
	/** Флаг сдвига floating-элемента внутрь viewport. */
	shift: boolean
	/** z-index floating-элемента. */
	zIndex?: number
}

/**
 * Результат вычисления позиции floating-элемента.
 */
export interface IFloatingPositionResult {
	/** Доступная высота для floating-элемента. */
	availableHeight: null | number
	/** Флаг, что reference-элемент не виден во viewport. */
	isReferenceHidden: boolean
	/** Итоговое расположение после применения flip. */
	placement: TFloatingPlacement
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
export interface IUseFloatingPositionOptions {
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
	onPositionChange?: (result: IFloatingPositionResult) => void
	/** Callback при первом обнаружении скрытого reference-элемента. */
	onReferenceHidden?: VoidFunction
	/** Минимальный отступ от границ viewport. */
	padding?: number
	/** Предпочитаемое расположение floating-элемента. */
	placement?: TFloatingPlacement
	/** Флаг выставления ширины floating-элемента по ширине reference. */
	sameWidth?: boolean
	/** Флаг сдвига floating-элемента внутрь viewport. */
	shift?: boolean
	/** z-index floating-элемента. */
	zIndex?: number
}

/**
 * Возвращаемое значение хука позиционирования floating-элемента.
 */
export interface IUseFloatingPositionReturn<
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
	placement: TFloatingPlacement
	/** Текущий reference-элемент. */
	referenceElement: null | TReference
	/** Ref callback для reference-элемента. */
	referenceRef: RefCallback<TReference>
	/** Запланировать обновление позиции через requestAnimationFrame. */
	update: VoidFunction
}
