import { type RefObject, useEffect, useRef } from "react"

type EventListenerOptions = AddEventListenerOptions | boolean

type EventListenerTarget = EventTarget | null | RefObject<EventTarget | null> | string | undefined

/**
 * Свойства для хука useEventListener.
 */
export interface UseEventListenerProps<TEvent extends Event = Event> {
	/** Функция-обработчик события. */
	listener: (event: TEvent) => void

	/** Опции для addEventListener. */
	options?: EventListenerOptions

	/** Цель подписки. По умолчанию `"document"`. */
	target?: EventListenerTarget

	/** Тип события, например `"click"` или `"scroll"`. */
	type: string

	/** Если `false`, обработчик не подписывается. */
	when?: boolean
}

/**
 * Разрешает цель для подписки на событие.
 */
const resolveTarget = (target: EventListenerTarget = "document"): EventTarget | null => {
	if (typeof window === "undefined") {
		return null
	}

	if (target === "window") {
		return window
	}

	if (target === "document") {
		return document
	}

	if (typeof target === "string") {
		return document.querySelector(target)
	}

	if (target && "current" in target) {
		return target.current
	}

	return target ?? null
}

/**
 * Хук для подписки на DOM-события с автоматической очисткой.
 *
 * @typeParam TEvent - Тип события.
 * @param props.type - Тип события (например, "click" или "scroll").
 * @param props.listener - Функция-обработчик события.
 * @param props.target - Цель подписки. По умолчанию `"document"`.
 * @param props.options - Опции для addEventListener.
 * @param props.when - Если `false`, обработчик не подписывается.
 */
export const useEventListener = <TEvent extends Event = Event>({
	target = "document",
	type,
	listener,
	options,
	when = true,
}: UseEventListenerProps<TEvent>): void => {
	const listenerRef = useRef(listener)

	useEffect(() => {
		listenerRef.current = listener
	}, [listener])

	useEffect(() => {
		const resolvedTarget = when ? resolveTarget(target) : null

		const eventListener = (event: Event): void => {
			listenerRef.current(event as TEvent)
		}

		resolvedTarget?.addEventListener(type, eventListener, options)

		return () => {
			resolvedTarget?.removeEventListener(type, eventListener, options)
		}
	}, [target, type, options, when])
}
