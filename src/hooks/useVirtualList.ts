import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Хук виртуализации списка для отображения только видимых элементов.
 *
 * @template T Тип элементов в списке.
 * @param params Параметры хука.
 * @param params.items Массив всех элементов списка.
 * @param params.itemHeight Высота одного элемента в пикселях.
 * @param params.containerHeight Высота контейнера (области прокрутки) в пикселях.
 * @param params.overscan Количество элементов, отрисовываемых сверх видимой области (по умолчанию 5).
 * @returns Объект с ссылкой на контейнер, высотой всего списка, видимыми элементами и индексом начала.
 */
export const useVirtualList = <T>({
	items,
	itemHeight,
	containerHeight,
	overscan = 5,
}: {
	containerHeight: number
	itemHeight: number
	items: T[]
	overscan?: number
}) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [scrollTop, setScrollTop] = useState(0)

	const totalCount = items.length
	const totalHeight = totalCount * itemHeight

	const visibleCount = Math.ceil(containerHeight / itemHeight)
	const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
	const endIndex = Math.min(totalCount, startIndex + visibleCount + overscan * 2)
	const visibleItems = items.slice(startIndex, endIndex)

	/**
	 * Обрабатывает событие прокрутки контейнера: обновляет scrollTop.
	 */
	const onScroll = useCallback(() => {
		const scroll = containerRef.current?.scrollTop ?? 0

		setScrollTop(scroll)
	}, [])

	useEffect(() => {
		const container = containerRef.current

		if (container) {
			container.addEventListener("scroll", onScroll, { passive: true })

			return () => {
				void container.removeEventListener("scroll", onScroll)
			}
		}
		return undefined
	}, [onScroll])

	return {
		/** Ссылка на контейнер, к которому нужно привязать scroll */
		containerRef,
		/** Общая высота всего списка (используется для контейнера с position: relative) */
		totalHeight,
		/** Отрисовываемые в DOM элементы (виртуализированные) */
		visibleItems,
		/** Индекс первого отрисовываемого элемента */
		startIndex,
	}
}
