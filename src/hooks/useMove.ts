import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react"

/**
 * Режим перемещения: по обеим осям, только по вертикали или только по горизонтали.
 */
type MoveMode = "both" | "horizontal" | "vertical"

/**
 * Координаты позиции.
 */
export interface Position {
	x: number
	y: number
}

/**
 * Параметры хука useMove.
 */
export interface UseMoveParams {
	/** Начальное значение позиции (от 0 до 1). */
	initialValue?: Partial<Position>
	/** Режим перемещения. По умолчанию `"both"`. */
	mode?: MoveMode
}

/**
 * Возвращаемое значение хука useMove.
 */
export interface UseMoveReturn extends Position {
	/** Флаг активности перемещения (зажат указатель). */
	active: boolean
	/** Ref на DOM-элемент, в котором происходит перемещение. */
	ref: RefObject<HTMLElement | null>
	/** Сбросить позицию к начальному значению. */
	reset: () => void
}

/** Опции для pointermove: отключаем пассивный режим, чтобы можно было вызвать preventDefault. */
const POINTER_MOVE_OPTIONS: AddEventListenerOptions = {
	passive: false,
}

/**
 * Ограничивает значение указанным диапазоном.
 *
 * @param value - Исходное значение.
 * @param min - Минимальное значение.
 * @param max - Максимальное значение.
 * @returns Значение, ограниченное диапазоном [min, max].
 */
const clamp = (value: number, min: number, max: number) => {
	return Math.min(Math.max(value, min), max)
}

/**
 * Нормализует позицию, приводя значения x и y к диапазону [0, 1].
 *
 * @param position - Частичная позиция (значения по умолчанию 0).
 * @returns Нормализованная позиция.
 */
const normalizePosition = ({ x = 0, y = 0 }: Partial<Position> = {}): Position => {
	return {
		x: clamp(x, 0, 1),
		y: clamp(y, 0, 1),
	}
}

/**
 * Вычисляет следующую позицию с учётом режима перемещения.
 *
 * @param previousPosition - Предыдущая позиция.
 * @param nextPosition - Следующая позиция (на основе события).
 * @param mode - Режим перемещения.
 * @returns Итоговая позиция.
 */
const getNextPosition = (previousPosition: Position, nextPosition: Position, mode: MoveMode): Position => {
	if (mode === "horizontal") {
		return {
			x: nextPosition.x,
			y: previousPosition.y,
		}
	}

	if (mode === "vertical") {
		return {
			x: previousPosition.x,
			y: 1 - nextPosition.y,
		}
	}

	return nextPosition
}

/**
 * Хук для отслеживания перемещения указателя внутри элемента.
 *
 * Возвращает относительные координаты (от 0 до 1) и флаг активности.
 * Полезно для создания ползунков, цветовых пикеров и других
 * интерактивных элементов, где нужно отслеживать позицию курсора.
 *
 * @param params - Параметры хука.
 * @returns Объект с ref, координатами, флагом активности и методом сброса.
 *
 * @example
 * ```tsx
 * const { ref, x, y, active } = useMove({ mode: "both" });
 *
 * return <div ref={ref}>Позиция: {x.toFixed(2)}, {y.toFixed(2)}</div>;
 * ```
 */
export const useMove = ({ mode = "both", initialValue }: UseMoveParams = {}): UseMoveReturn => {
	const initialPosition = useMemo(() => {
		return normalizePosition(initialValue)
	}, [initialValue])

	const [position, setPosition] = useState<Position>(() => {
		return initialPosition
	})

	const [active, setActive] = useState(false)

	const ref = useRef<HTMLElement | null>(null)
	const isMovingRef = useRef(false)
	const pointerIdRef = useRef<null | number>(null)

	/**
	 * Обновляет позицию на основе события указателя.
	 * Вычисляет относительные координаты (0..1) внутри элемента.
	 * @param event - Событие указателя.
	 */
	const updatePositionFromEvent = useCallback(
		(event: PointerEvent) => {
			const element = ref.current

			if (!element || !isMovingRef.current) {
				return
			}

			if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
				return
			}

			const rect = element.getBoundingClientRect()

			if (rect.width === 0 || rect.height === 0) {
				return
			}

			const nextPosition = normalizePosition({
				x: (event.clientX - rect.left) / rect.width,
				y: (event.clientY - rect.top) / rect.height,
			})

			setPosition((previousPosition) => {
				return getNextPosition(previousPosition, nextPosition, mode)
			})
		},
		[mode],
	)

	/**
	 * Останавливает перемещение: сбрасывает флаги движения и активность.
	 */
	const stop = useCallback(() => {
		isMovingRef.current = false
		pointerIdRef.current = null
		setActive(false)
	}, [])

	/**
	 * Начинает перемещение: проверяет кнопку мыши, предотвращает стандартное поведение
	 * и обновляет позицию.
	 * @param event - Событие pointerdown.
	 */
	const start = useCallback(
		(event: PointerEvent) => {
			if (event.pointerType === "mouse" && event.button !== 0) {
				return
			}

			event.preventDefault()

			isMovingRef.current = true
			pointerIdRef.current = event.pointerId
			setActive(true)

			updatePositionFromEvent(event)
		},
		[updatePositionFromEvent],
	)

	/**
	 * Обрабатывает движение указателя: предотвращает стандартное поведение
	 * и обновляет позицию.
	 * @param event - Событие pointermove.
	 */
	const handlePointerMove = useCallback(
		(event: PointerEvent) => {
			if (event.cancelable) {
				event.preventDefault()
			}

			updatePositionFromEvent(event)
		},
		[updatePositionFromEvent],
	)

	/**
	 * Обрабатывает завершение перемещения: проверяет идентификатор указателя
	 * и останавливает перемещение.
	 * @param event - Событие pointerup или pointercancel.
	 */
	const handlePointerEnd = useCallback(
		(event: PointerEvent) => {
			if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
				return
			}

			stop()
		},
		[stop],
	)

	/**
	 * Обрабатывает потерю фокуса окном: останавливает перемещение.
	 */
	const handleWindowBlur = useCallback(() => {
		stop()
	}, [stop])

	/**
	 * Сбрасывает позицию к начальному значению.
	 */
	const reset = useCallback(() => {
		setPosition(initialPosition)
	}, [initialPosition])

	useEffect(() => {
		const element = ref.current

		if (element) {
			element.addEventListener("pointerdown", start)
		}

		return () => {
			element?.removeEventListener("pointerdown", start)
		}
	}, [start])

	useEffect(() => {
		if (active) {
			document.addEventListener("pointermove", handlePointerMove, POINTER_MOVE_OPTIONS)
			document.addEventListener("pointerup", handlePointerEnd)
			document.addEventListener("pointercancel", handlePointerEnd)
			window.addEventListener("blur", handleWindowBlur)
		}

		return () => {
			document.removeEventListener("pointermove", handlePointerMove, POINTER_MOVE_OPTIONS)
			document.removeEventListener("pointerup", handlePointerEnd)
			document.removeEventListener("pointercancel", handlePointerEnd)
			window.removeEventListener("blur", handleWindowBlur)
		}
	}, [active, handlePointerMove, handlePointerEnd, handleWindowBlur])

	return {
		ref,
		x: position.x,
		y: position.y,
		active,
		reset,
	}
}
