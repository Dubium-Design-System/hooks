import { type RefCallback, useCallback, useEffect, useMemo, useState } from "react"

/**
 * Тип указателя для отслеживания наведения.
 */
export type THoverPointerType = "mouse" | "pen" | "touch"

/**
 * Опции хука `useHover`.
 */
export interface IUseHoverOptions {
	/** Флаг отключения отслеживания наведения. */
	disabled?: boolean
	/** Типы указателей, для которых отслеживается наведение. */
	pointerTypes?: readonly THoverPointerType[]
}

/**
 * Возвращаемое значение хука `useHover`.
 */
export interface IUseHoverReturn<TElement extends HTMLElement> {
	/** Флаг наведения указателя на элемент. */
	isHovered: boolean
	/** Ref callback для привязки к отслеживаемому элементу. */
	ref: RefCallback<TElement>
}

/** Типы указателей по умолчанию: мышь и перо. */
const DEFAULT_POINTER_TYPES: readonly THoverPointerType[] = ["mouse", "pen"]

/**
 * Отслеживает наведение указателя на элемент.
 *
 * Использует Pointer Events для определения наведения,
 * поддерживает фильтрацию по типу указателя (мышь, перо, сенсор).
 *
 * @param options - Опции отслеживания наведения.
 * @returns Объект с флагом `isHovered` и `ref` для привязки к элементу.
 */
export const useHover = <TElement extends HTMLElement = HTMLElement>({
	disabled = false,
	pointerTypes = DEFAULT_POINTER_TYPES,
}: IUseHoverOptions = {}): IUseHoverReturn<TElement> => {
	/** Состояние отслеживаемого элемента. */
	const [element, setElement] = useState<null | TElement>(null)
	/** Состояние элемента, на который наведён указатель. */
	const [hoveredElement, setHoveredElement] = useState<null | TElement>(null)
	/** Множество разрешённых типов указателей для быстрой проверки. */
	const allowedPointerTypes = useMemo(() => new Set<string>(pointerTypes), [pointerTypes])

	/** Ref callback для привязки к элементу. */
	const ref = useCallback<RefCallback<TElement>>((node) => {
		setElement(node)
	}, [])

	useEffect(() => {
		if (!element || disabled) {
			return undefined
		}

		/** Обработчик входа указателя в элемент. */
		const handlePointerEnter = (event: PointerEvent): void => {
			if (allowedPointerTypes.has(event.pointerType)) {
				setHoveredElement(element)
			}
		}

		/** Обработчик выхода указателя из элемента. */
		const handlePointerLeave = (event: PointerEvent): void => {
			if (allowedPointerTypes.has(event.pointerType)) {
				setHoveredElement(null)
			}
		}

		element.addEventListener("pointerenter", handlePointerEnter)
		element.addEventListener("pointerleave", handlePointerLeave)

		return () => {
			element.removeEventListener("pointerenter", handlePointerEnter)
			element.removeEventListener("pointerleave", handlePointerLeave)
		}
	}, [allowedPointerTypes, disabled, element])

	return {
		isHovered: !disabled && hoveredElement === element,
		ref,
	}
}
