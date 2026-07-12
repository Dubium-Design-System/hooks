import { useEffect, useRef } from "react"

/**
 * Цель для подписки на события.
 */
export type TEventListenerTarget = "document" | "window" | EventTarget | null

/**
 * Базовые опции подписки на события.
 */
interface IUseEventListenerBaseOptions {
	/** Флаг использования фазы capture (перехвата). */
	capture?: boolean
	/** Флаг однократного выполнения события. */
	once?: boolean
	/** Флаг пассивного слушателя. */
	passive?: boolean
	/** Цель для подписки на событие. */
	target?: TEventListenerTarget
	/** Флаг активности подписки. */
	when?: boolean
}

/**
 * Опции подписки на события для произвольного EventTarget.
 */
export interface IUseEventListenerOptions<TEvent extends Event = Event> extends IUseEventListenerBaseOptions {
	/** Обработчик события. */
	listener: (event: TEvent) => void
	/** Тип события. */
	type: string
}

/** Опции подписки на события окна. */
type TWindowEventListenerOptions<K extends keyof WindowEventMap> = IUseEventListenerBaseOptions & {
	listener: (event: WindowEventMap[K]) => void
	target: "window"
	type: K
}

/** Опции подписки на события документа. */
type TDocumentEventListenerOptions<K extends keyof DocumentEventMap> = IUseEventListenerBaseOptions & {
	listener: (event: DocumentEventMap[K]) => void
	target?: "document"
	type: K
}

/**
 * Разрешает цель подписки: преобразует строковые значения "document"/"window"
 * в соответствующие глобальные объекты.
 *
 * @param target - Цель подписки.
 * @returns EventTarget или null, если цель недоступна.
 */
const resolveTarget = (target: TEventListenerTarget): EventTarget | null => {
	if (target !== "document" && target !== "window") {
		return target
	}

	if (typeof window === "undefined") {
		return null
	}

	if (target === "window") {
		return window
	}

	return document
}

/**
 * Подписывается на события DOM с автоматической очисткой.
 *
 * Поддерживает типизированные события для window и document,
 * а также произвольные EventTarget. Автоматически обновляет
 * listener при его изменении.
 *
 * @param options - Опции подписки на события.
 */
export function useEventListener<K extends keyof WindowEventMap>(options: TWindowEventListenerOptions<K>): void
export function useEventListener<K extends keyof DocumentEventMap>(options: TDocumentEventListenerOptions<K>): void
export function useEventListener<TEvent extends Event = Event>(options: IUseEventListenerOptions<TEvent>): void
export function useEventListener<TEvent extends Event = Event>({
	capture = false,
	listener,
	once = false,
	passive = false,
	target = "document",
	type,
	when = true,
}: IUseEventListenerOptions<TEvent>): void {
	/** Ref для хранения актуального обработчика. */
	const listenerRef = useRef(listener)

	useEffect(() => {
		listenerRef.current = listener
	}, [listener])

	useEffect(() => {
		if (!when) {
			return undefined
		}

		const resolvedTarget = resolveTarget(target)

		if (!resolvedTarget) {
			return undefined
		}

		/** Обработчик события, вызывающий актуальный listener из ref. */
		const eventListener = (event: Event): void => {
			listenerRef.current(event as TEvent)
		}

		const options: AddEventListenerOptions = { capture, once, passive }

		resolvedTarget.addEventListener(type, eventListener, options)

		return () => {
			resolvedTarget.removeEventListener(type, eventListener, capture)
		}
	}, [capture, once, passive, target, type, when])
}
