import { type RefCallback, useCallback, useEffect, useMemo, useRef, useState } from "react"

/**
 * Режим перемещения: по обеим осям, только по горизонтали или только по вертикали.
 */
export type TMoveMode = "both" | "horizontal" | "vertical"

/**
 * Позиция с координатами x и y.
 */
export interface IPosition {
	x: number
	y: number
}

/**
 * Опции хука `useMove`.
 */
export interface IUseMoveOptions {
	/** Флаг отключения отслеживания перемещения. */
	disabled?: boolean
	/** Начальное значение позиции. */
	initialValue?: Partial<IPosition>
	/** Инвертировать ось X. */
	invertX?: boolean
	/** Инвертировать ось Y. */
	invertY?: boolean
	/** Режим перемещения. */
	mode?: TMoveMode
	/** Колбэк при изменении позиции. */
	onChange?: (position: IPosition) => void
}

/**
 * Возвращаемое значение хука `useMove`.
 */
export interface IUseMoveReturn<TElement extends HTMLElement> extends IPosition {
	/** Флаг активности перемещения (зажат указатель). */
	active: boolean
	/** Ref callback для привязки к элементу. */
	ref: RefCallback<TElement>
	/** Сбрасывает позицию к начальному значению. */
	reset: VoidFunction
	/** Устанавливает произвольную позицию. */
	setPosition: (position: ((currentPosition: IPosition) => IPosition) | IPosition) => void
}

/** Опции Pointer Events: непассивные для возможности preventDefault. */
const POINTER_OPTIONS: AddEventListenerOptions = { passive: false }

/**
 * Ограничивает значение диапазоном [0, 1].
 *
 * @param value - Исходное значение.
 * @returns Значение в диапазоне [0, 1].
 */
const clamp = (value: number): number => {
	return Math.min(Math.max(value, 0), 1)
}

/**
 * Нормализует позицию: приводит координаты к диапазону [0, 1].
 *
 * @param position - Частичная позиция.
 * @returns Нормализованная позиция.
 */
const normalizePosition = ({ x = 0, y = 0 }: Partial<IPosition> = {}): IPosition => ({
	x: clamp(Number.isFinite(x) ? x : 0),
	y: clamp(Number.isFinite(y) ? y : 0),
})

/**
 * Хук для отслеживания перемещения указателя относительно элемента.
 *
 * Возвращает нормализованные координаты (0–1) и флаг активности.
 * Поддерживает инверсию осей, ограничение по осям и колбэк onChange.
 *
 * @param options - Опции отслеживания перемещения.
 * @returns Объект с координатами, флагом активности и ref для привязки.
 */
export const useMove = <TElement extends HTMLElement = HTMLElement>({
	disabled = false,
	initialValue,
	invertX = false,
	invertY = false,
	mode = "both",
	onChange,
}: IUseMoveOptions = {}): IUseMoveReturn<TElement> => {
	const initialX = initialValue?.x
	const initialY = initialValue?.y
	/** Начальная позиция, вычисляемая один раз. */
	const initialPosition = useMemo(() => normalizePosition({ x: initialX, y: initialY }), [initialX, initialY])
	/** Состояние отслеживаемого элемента. */
	const [element, setElement] = useState<null | TElement>(null)
	/** Текущая позиция указателя. */
	const [position, setPosition] = useState(initialPosition)
	/** Флаг активности (зажат указатель). */
	const [active, setActive] = useState(false)
	/** Ref для хранения идентификатора указателя. */
	const pointerIdRef = useRef<null | number>(null)
	/** Ref для хранения актуального колбэка onChange. */
	const onChangeRef = useRef(onChange)

	useEffect(() => {
		onChangeRef.current = onChange
	}, [onChange])

	/** Ref callback для привязки к элементу. */
	const ref = useCallback<RefCallback<TElement>>((node) => {
		setElement(node)
	}, [])

	/** Устанавливает позицию с нормализацией и вызовом onChange. */
	const setPositionValue = useCallback(
		(nextPosition: ((currentPosition: IPosition) => IPosition) | IPosition): void => {
			setPosition((currentPosition) => {
				const resolvedPosition =
					typeof nextPosition === "function" ? nextPosition(currentPosition) : nextPosition
				const normalizedPosition = normalizePosition(resolvedPosition)

				onChangeRef.current?.(normalizedPosition)

				return normalizedPosition
			})
		},
		[],
	)

	/** Сбрасывает позицию к начальному значению. */
	const reset = useCallback((): void => {
		setPositionValue(initialPosition)
	}, [initialPosition, setPositionValue])

	useEffect(() => {
		if (!element || disabled) {
			return undefined
		}

		/** Обновляет позицию из события PointerEvent. */
		const updateFromPointer = (event: PointerEvent): void => {
			if (pointerIdRef.current !== event.pointerId) {
				return
			}

			const rect = element.getBoundingClientRect()

			if (rect.width <= 0 || rect.height <= 0) {
				return
			}

			let x = clamp((event.clientX - rect.left) / rect.width)
			let y = clamp((event.clientY - rect.top) / rect.height)

			if (invertX) {
				x = 1 - x
			}

			if (invertY) {
				y = 1 - y
			}

			setPositionValue((currentPosition) => ({
				x: mode === "vertical" ? currentPosition.x : x,
				y: mode === "horizontal" ? currentPosition.y : y,
			}))
		}

		/** Завершает отслеживание перемещения. */
		const stop = (event?: PointerEvent): void => {
			if (event && pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
				return
			}

			const pointerId = pointerIdRef.current
			pointerIdRef.current = null
			setActive(false)

			if (pointerId !== null && element.hasPointerCapture(pointerId)) {
				element.releasePointerCapture(pointerId)
			}
		}

		/** Обработчик нажатия указателя. */
		const handlePointerDown = (event: PointerEvent): void => {
			if (event.pointerType === "mouse" && event.button !== 0) {
				return
			}

			if (event.cancelable) {
				event.preventDefault()
			}

			pointerIdRef.current = event.pointerId
			element.setPointerCapture(event.pointerId)
			setActive(true)
			updateFromPointer(event)
		}

		/** Обработчик перемещения указателя. */
		const handlePointerMove = (event: PointerEvent): void => {
			if (pointerIdRef.current !== event.pointerId) {
				return
			}

			if (event.cancelable) {
				event.preventDefault()
			}

			updateFromPointer(event)
		}

		/** Обработчик отпускания указателя. */
		const handlePointerEnd = (event: PointerEvent): void => {
			stop(event)
		}

		/** Обработчик потери фокуса окном. */
		const handleWindowBlur = (): void => {
			stop()
		}

		element.addEventListener("pointerdown", handlePointerDown, POINTER_OPTIONS)
		element.addEventListener("pointermove", handlePointerMove, POINTER_OPTIONS)
		element.addEventListener("pointerup", handlePointerEnd)
		element.addEventListener("pointercancel", handlePointerEnd)
		element.addEventListener("lostpointercapture", handlePointerEnd)

		if (element.ownerDocument.defaultView) {
			element.ownerDocument.defaultView.addEventListener("blur", handleWindowBlur)
		}

		return () => {
			element.removeEventListener("pointerdown", handlePointerDown, POINTER_OPTIONS)
			element.removeEventListener("pointermove", handlePointerMove, POINTER_OPTIONS)
			element.removeEventListener("pointerup", handlePointerEnd)
			element.removeEventListener("pointercancel", handlePointerEnd)
			element.removeEventListener("lostpointercapture", handlePointerEnd)

			if (element.ownerDocument.defaultView) {
				element.ownerDocument.defaultView.removeEventListener("blur", handleWindowBlur)
			}

			const pointerId = pointerIdRef.current
			pointerIdRef.current = null

			if (pointerId !== null && element.hasPointerCapture(pointerId)) {
				element.releasePointerCapture(pointerId)
			}

			setActive(false)
		}
	}, [disabled, element, invertX, invertY, mode, setPositionValue])

	return {
		active: !disabled && active,
		ref,
		reset,
		setPosition: setPositionValue,
		x: position.x,
		y: position.y,
	}
}
