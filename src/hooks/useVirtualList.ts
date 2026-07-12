import { type RefCallback, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

/**
 * Тип выравнивания при скролле к элементу в виртуальном списке.
 */
export type TVirtualListAlign = "auto" | "center" | "end" | "start"

/**
 * Элемент виртуального списка с вычисленными размерами и позицией.
 */
export interface IVirtualListItem<T> {
	/** Конечная позиция элемента. */
	end: number
	/** Индекс элемента в исходном массиве. */
	index: number
	/** Исходный элемент данных. */
	item: T
	/** Размер элемента. */
	size: number
	/** Начальная позиция элемента. */
	start: number
}

/**
 * Опции хука `useVirtualList`.
 */
export interface IUseVirtualListOptions<T> {
	/** Высота одного элемента списка. */
	itemHeight: number
	/** Массив элементов для виртуализации. */
	items: readonly T[]
	/** Количество дополнительных элементов за пределами видимого диапазона. */
	overscan?: number
}

/**
 * Опции для скролла к элементу по индексу.
 */
export interface IScrollToIndexOptions {
	/** Тип выравнивания элемента при скролле. */
	align?: TVirtualListAlign
	/** Поведение скролла. */
	behavior?: ScrollBehavior
}

/**
 * Возвращаемое значение хука `useVirtualList`.
 */
export interface IUseVirtualListReturn<T, TElement extends HTMLElement> {
	/** Ref callback для контейнера списка. */
	containerRef: RefCallback<TElement>
	/** Индекс последнего видимого элемента. */
	endIndex: number
	/** Отступ сверху для позиционирования видимых элементов. */
	offsetTop: number
	/** Скроллит к элементу по индексу. */
	scrollToIndex: (index: number, options?: IScrollToIndexOptions) => void
	/** Индекс первого видимого элемента. */
	startIndex: number
	/** Общая высота всех элементов списка. */
	totalSize: number
	/** Массив виртуальных элементов для рендеринга. */
	virtualItems: IVirtualListItem<T>[]
}

/**
 * Изоморфный layout-effect для SSR и браузера.
 */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

/**
 * Ограничивает значение диапазоном [min, max].
 *
 * @param value - Исходное значение.
 * @param min - Минимальное значение.
 * @param max - Максимальное значение.
 * @returns Значение внутри диапазона.
 */
const clamp = (value: number, min: number, max: number): number => {
	return Math.min(Math.max(value, min), max)
}

/**
 * Хук для виртуализации списка.
 *
 * Рендерит только видимую часть элементов с учётом overscan,
 * обеспечивая высокую производительность при больших списках.
 * Поддерживает скролл к элементу с различными вариантами выравнивания.
 *
 * @param options - Опции виртуального списка.
 * @returns Объект с ref, индексами видимого диапазона и виртуальными элементами.
 */
export const useVirtualList = <T, TElement extends HTMLElement = HTMLDivElement>({
	itemHeight,
	items,
	overscan = 5,
}: IUseVirtualListOptions<T>): IUseVirtualListReturn<T, TElement> => {
	/** Состояние DOM-элемента контейнера. */
	const [containerElement, setContainerElement] = useState<null | TElement>(null)
	/** Состояние viewport: высота и позиция скролла. */
	const [viewport, setViewport] = useState({ height: 0, scrollTop: 0 })
	/** Ref для хранения идентификатора animation frame. */
	const frameRef = useRef<null | number>(null)
	/** Безопасная высота элемента. */
	const safeItemHeight = Number.isFinite(itemHeight) ? Math.max(1, itemHeight) : 1
	/** Безопасное количество дополнительных элементов. */
	const safeOverscan = Number.isFinite(overscan) ? Math.max(0, Math.floor(overscan)) : 0
	/** Общая высота всех элементов. */
	const totalSize = items.length * safeItemHeight

	/** Ref callback для контейнера списка. */
	const containerRef = useCallback<RefCallback<TElement>>((node) => {
		setContainerElement(node)
	}, [])

	/** Измеряет текущие размеры и позицию скролла контейнера. */
	const measure = useCallback((): void => {
		if (!containerElement) {
			return
		}

		setViewport((currentViewport) => {
			const nextViewport = {
				height: containerElement.clientHeight,
				scrollTop: containerElement.scrollTop,
			}

			if (
				currentViewport.height === nextViewport.height &&
				currentViewport.scrollTop === nextViewport.scrollTop
			) {
				return currentViewport
			}

			return nextViewport
		})
	}, [containerElement])

	/** Планирует измерение на следующий animation frame. */
	const scheduleMeasure = useCallback((): void => {
		if (!containerElement || frameRef.current !== null) {
			return
		}

		const ownerWindow = containerElement.ownerDocument.defaultView

		if (!ownerWindow) {
			return
		}

		frameRef.current = ownerWindow.requestAnimationFrame(() => {
			frameRef.current = null
			measure()
		})
	}, [containerElement, measure])

	useIsomorphicLayoutEffect(() => {
		if (!containerElement) {
			return undefined
		}

		scheduleMeasure()
		containerElement.addEventListener("scroll", scheduleMeasure, { passive: true })

		const ownerWindow = containerElement.ownerDocument.defaultView

		const ResizeObserverConstructor = ownerWindow?.ResizeObserver

		const resizeObserver = ResizeObserverConstructor ? new ResizeObserverConstructor(scheduleMeasure) : null

		if (resizeObserver) {
			resizeObserver.observe(containerElement)
		}

		if (ownerWindow) {
			ownerWindow.addEventListener("resize", scheduleMeasure)
		}

		return () => {
			containerElement.removeEventListener("scroll", scheduleMeasure)

			if (ownerWindow) {
				ownerWindow.removeEventListener("resize", scheduleMeasure)
			}

			if (resizeObserver) {
				resizeObserver.disconnect()
			}

			if (frameRef.current !== null && ownerWindow) {
				ownerWindow.cancelAnimationFrame(frameRef.current)
				frameRef.current = null
			}
		}
	}, [containerElement, measure, scheduleMeasure])

	useIsomorphicLayoutEffect(() => {
		if (!containerElement) {
			return
		}

		const maxScrollTop = Math.max(totalSize - containerElement.clientHeight, 0)

		if (containerElement.scrollTop > maxScrollTop) {
			containerElement.scrollTo({ top: maxScrollTop })
			scheduleMeasure()
		}
	}, [containerElement, scheduleMeasure, totalSize])

	/** Вычисленный диапазон видимых элементов. */
	const range = useMemo(() => {
		if (items.length === 0) {
			return { endIndex: 0, startIndex: 0 }
		}

		const visibleCount = Math.max(1, Math.ceil(viewport.height / safeItemHeight))
		const firstVisibleIndex = clamp(Math.floor(viewport.scrollTop / safeItemHeight), 0, items.length - 1)
		const startIndex = Math.max(0, firstVisibleIndex - safeOverscan)
		const endIndex = Math.min(items.length, firstVisibleIndex + visibleCount + safeOverscan)

		return { endIndex, startIndex }
	}, [items.length, safeItemHeight, safeOverscan, viewport.height, viewport.scrollTop])

	/** Массив виртуальных элементов для рендеринга. */
	const virtualItems = useMemo(
		() =>
			items.slice(range.startIndex, range.endIndex).map((item, localIndex) => {
				const index = range.startIndex + localIndex
				const start = index * safeItemHeight

				return {
					end: start + safeItemHeight,
					index,
					item,
					size: safeItemHeight,
					start,
				}
			}),
		[items, range.endIndex, range.startIndex, safeItemHeight],
	)

	/** Скроллит к элементу по индексу с указанным выравниванием. */
	const scrollToIndex = useCallback(
		(index: number, { align = "auto", behavior = "auto" }: IScrollToIndexOptions = {}): void => {
			if (!containerElement || items.length === 0) {
				return
			}

			const safeIndex = clamp(Math.floor(index), 0, items.length - 1)
			const itemStart = safeIndex * safeItemHeight
			const itemEnd = itemStart + safeItemHeight
			const viewportStart = containerElement.scrollTop
			const viewportEnd = viewportStart + containerElement.clientHeight
			let top = viewportStart

			if (align === "start") {
				top = itemStart
			}

			if (align === "center") {
				top = itemStart - (containerElement.clientHeight - safeItemHeight) / 2
			}

			if (align === "end") {
				top = itemEnd - containerElement.clientHeight
			}

			if (align === "auto" && itemStart < viewportStart) {
				top = itemStart
			}

			if (align === "auto" && itemEnd > viewportEnd) {
				top = itemEnd - containerElement.clientHeight
			}

			containerElement.scrollTo({
				behavior,
				top: clamp(top, 0, Math.max(totalSize - containerElement.clientHeight, 0)),
			})
		},
		[containerElement, items.length, safeItemHeight, totalSize],
	)

	return {
		containerRef,
		endIndex: range.endIndex,
		offsetTop: range.startIndex * safeItemHeight,
		scrollToIndex,
		startIndex: range.startIndex,
		totalSize,
		virtualItems,
	}
}
