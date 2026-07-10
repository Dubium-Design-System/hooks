import { type RefObject, useEffect, useState } from "react"

/**
 * Хук для отслеживания видимости элемента через IntersectionObserver.
 *
 * @param ref DOM-элемент, видимость которого отслеживается.
 * @param options Настройки IntersectionObserver.
 *
 * @returns `true`, если элемент видим или IntersectionObserver не поддерживается.
 */
export const useIntersectionObserver = (
	ref: RefObject<Element | null>,
	options: IntersectionObserverInit = {},
): boolean => {
	const [isVisible, setIsVisible] = useState(false)

	const { root = null, rootMargin = "0px", threshold = 0 } = options

	const Observer = Reflect.get(globalThis, "IntersectionObserver") as typeof IntersectionObserver | undefined

	useEffect(() => {
		const node = ref.current
		let observer: IntersectionObserver | undefined

		if (node && Observer) {
			observer = new Observer(
				([entry]) => {
					setIsVisible(entry.isIntersecting)
				},
				{
					root,
					rootMargin,
					threshold,
				},
			)

			observer.observe(node)
		}

		return () => {
			observer?.disconnect()
		}
	}, [ref, root, rootMargin, threshold, Observer])

	return Observer ? isVisible : true
}
