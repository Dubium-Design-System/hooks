import { type RefCallback, useCallback, useEffect, useRef, useState } from "react"

/**
 * Опции хука `useIntersectionObserver`.
 */
export interface IUseIntersectionObserverOptions {
	/** Флаг отключения наблюдения. */
	disabled?: boolean
	/** Значение isIntersecting по умолчанию, если IntersectionObserver не поддерживается. */
	fallbackInView?: boolean
	/** Заморозить состояние после первого пересечения. */
	freezeOnceVisible?: boolean
	/** Колбэк при изменении состояния пересечения. */
	onChange?: (entry: IntersectionObserverEntry) => void
	/** Корневой элемент для IntersectionObserver. */
	root?: Document | Element | null
	/** Отступ корневого элемента. */
	rootMargin?: string
	/** Порог срабатывания IntersectionObserver. */
	threshold?: number | number[]
}

/**
 * Возвращаемое значение хука `useIntersectionObserver`.
 */
export interface IUseIntersectionObserverReturn<TElement extends Element> {
	/** Последняя запись IntersectionObserverEntry. */
	entry: IntersectionObserverEntry | null
	/** Флаг пересечения элемента с viewport. */
	isIntersecting: boolean
	/** Ref callback для привязки к наблюдаемому элементу. */
	ref: RefCallback<TElement>
}

/**
 * Отслеживает пересечение элемента с viewport с помощью IntersectionObserver.
 *
 * Поддерживает опции root, rootMargin, threshold, freezeOnceVisible,
 * fallback для SSR и callback onChange.
 *
 * @param options - Опции IntersectionObserver.
 * @returns Объект с entry, isIntersecting и ref для привязки к элементу.
 */
export const useIntersectionObserver = <TElement extends Element = Element>({
	disabled = false,
	fallbackInView = true,
	freezeOnceVisible = false,
	onChange,
	root = null,
	rootMargin = "0px",
	threshold = 0,
}: IUseIntersectionObserverOptions = {}): IUseIntersectionObserverReturn<TElement> => {
	/** Состояние наблюдаемого элемента. */
	const [element, setElement] = useState<null | TElement>(null)
	/** Состояние последней записи IntersectionObserverEntry. */
	const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
	/** Ref для хранения актуального колбэка onChange. */
	const onChangeRef = useRef(onChange)
	/** Флаг заморозки состояния после первого пересечения. */
	const frozen = freezeOnceVisible && entry?.isIntersecting === true
	/** Window, к которому принадлежит элемент. */
	const ownerWindow = element?.ownerDocument.defaultView
	/** Флаг поддержки IntersectionObserver в браузере. */
	const isSupported = typeof ownerWindow?.IntersectionObserver === "function"

	useEffect(() => {
		onChangeRef.current = onChange
	}, [onChange])

	/** Ref callback для привязки к наблюдаемому элементу. */
	const ref = useCallback<RefCallback<TElement>>((node) => {
		setElement(node)
	}, [])

	useEffect(() => {
		if (!element || disabled || frozen) {
			return undefined
		}

		const Observer = element.ownerDocument.defaultView?.IntersectionObserver

		if (typeof Observer !== "function") {
			return undefined
		}

		const observer = new Observer(
			([nextEntry]) => {
				setEntry(nextEntry)
				onChangeRef.current?.(nextEntry)
			},
			{ root, rootMargin, threshold },
		)

		observer.observe(element)

		return () => {
			observer.disconnect()
		}
	}, [disabled, element, frozen, root, rootMargin, threshold])

	return {
		entry,
		isIntersecting: disabled || !element || !isSupported ? fallbackInView : Boolean(entry?.isIntersecting),
		ref,
	}
}
