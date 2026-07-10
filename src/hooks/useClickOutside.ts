import { type RefObject, useEffect, useRef } from "react"

/**
 * Тип события, используемого в хуке useClickOutside.
 */
export type ClickOutsideEvent = PointerEvent

/**
 * Хук для отслеживания кликов вне заданного DOM-элемента.
 *
 * Позволяет вызывать callback при клике (pointerdown) за пределами элемента,
 * на который указывает `ref`. Полезно для закрытия выпадающих списков,
 * модальных окон и других всплывающих элементов.
 *
 * @param ref - Ref на DOM-элемент, клики вне которого нужно отслеживать.
 * @param callback - Функция, вызываемая при клике вне элемента.
 * @param enabled - Флаг активности хука. Если `false`, обработчик не навешивается.
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setIsOpen(false));
 *
 * return <div ref={ref}>...</div>;
 * ```
 */
export const useClickOutside = (
	ref: RefObject<HTMLElement | null>,
	callback: (event: ClickOutsideEvent) => void,
	enabled = true,
): void => {
	const callbackRef = useRef(callback)

	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	useEffect(() => {
		const handlePointerDown = (event: PointerEvent): void => {
			const element = ref.current
			const { target } = event

			if (!element || !(target instanceof Node)) {
				return
			}

			if (element.contains(target)) {
				return
			}

			callbackRef.current(event)
		}

		if (enabled) {
			document.addEventListener("pointerdown", handlePointerDown)
		}

		return () => {
			if (enabled) {
				document.removeEventListener("pointerdown", handlePointerDown)
			}
		}
	}, [enabled, ref])
}
