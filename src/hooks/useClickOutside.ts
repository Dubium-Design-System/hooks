import { type RefObject, useEffect, useRef } from "react"

/**
 * Событие клика вне целевого элемента.
 */
export type TClickOutsideEvent = MouseEvent | PointerEvent

/**
 * Тип события для отслеживания клика вне элемента.
 */
export type TClickOutsideEventType = "click" | "pointerdown" | "pointerup"

/**
 * Опции хука `useClickOutside`.
 */
export interface IUseClickOutsideOptions {
	/** Флаг использования фазы capture (перехвата) при подписке на событие. */
	capture?: boolean
	/** Флаг активности отслеживания кликов. */
	enabled?: boolean
	/** Тип события для отслеживания. */
	eventType?: TClickOutsideEventType
	/** Список ref-ов, клики на которых следует игнорировать. */
	ignoreRefs?: readonly RefObject<Node | null>[]
	/** Колбэк, вызываемый при клике вне целевых элементов. */
	onOutsideClick: (event: TClickOutsideEvent) => void
	/** Флаг пассивного слушателя события. */
	passive?: boolean
	/** Корневой элемент для подписки на событие (document, ShadowRoot). */
	root?: Document | null | ShadowRoot
	/** Список ref-ов целевых элементов для отслеживания. */
	targetRefs: readonly RefObject<Node | null>[]
}

/**
 * Проверяет, находится ли событие внутри одного из указанных DOM-элементов.
 *
 * @param event - Событие.
 * @param refs - Список ref-ов для проверки.
 * @returns `true`, если событие произошло внутри хотя бы одного элемента.
 */
const isEventInside = (event: Event, refs: readonly RefObject<Node | null>[]): boolean => {
	const path = event.composedPath()
	const eventTarget = event.target

	return refs.some(({ current }) => {
		if (!current) {
			return false
		}

		if (path.includes(current)) {
			return true
		}

		return eventTarget instanceof Node && current.contains(eventTarget)
	})
}

/**
 * Отслеживает клики вне указанных DOM-элементов.
 *
 * Вызывает `onOutsideClick`, когда пользователь кликает за пределами
 * всех элементов из `targetRefs`. Позволяет игнорировать клики
 * на элементах из `ignoreRefs`.
 *
 * @param options - Опции отслеживания кликов вне элемента.
 */
export const useClickOutside = ({
	capture = true,
	enabled = true,
	eventType = "pointerdown",
	ignoreRefs = [],
	onOutsideClick,
	passive = false,
	root,
	targetRefs,
}: IUseClickOutsideOptions): void => {
	/** Ref для хранения актуального колбэка onOutsideClick. */
	const callbackRef = useRef(onOutsideClick)
	/** Ref для хранения актуального списка целевых элементов. */
	const targetRefsRef = useRef(targetRefs)
	/** Ref для хранения актуального списка игнорируемых элементов. */
	const ignoreRefsRef = useRef(ignoreRefs)

	useEffect(() => {
		callbackRef.current = onOutsideClick
	}, [onOutsideClick])

	useEffect(() => {
		targetRefsRef.current = targetRefs
		ignoreRefsRef.current = ignoreRefs
	}, [ignoreRefs, targetRefs])

	useEffect(() => {
		if (!enabled) {
			return undefined
		}

		let eventRoot = root

		if (eventRoot === undefined) {
			eventRoot = typeof document === "undefined" ? null : document
		}

		if (!eventRoot) {
			return undefined
		}

		/** Обработчик события клика. */
		const handleEvent = (event: Event): void => {
			const currentTargets = targetRefsRef.current

			if (currentTargets.every(({ current }) => current === null)) {
				return
			}

			if (isEventInside(event, currentTargets)) {
				return
			}

			if (isEventInside(event, ignoreRefsRef.current)) {
				return
			}

			callbackRef.current(event as TClickOutsideEvent)
		}

		const options: AddEventListenerOptions = {
			capture,
			passive,
		}

		eventRoot.addEventListener(eventType, handleEvent, options)

		return () => {
			eventRoot.removeEventListener(eventType, handleEvent, capture)
		}
	}, [capture, enabled, eventType, passive, root])
}
