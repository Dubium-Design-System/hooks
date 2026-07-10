import { type Ref, type RefCallback, useCallback } from "react"

/**
 * Вспомогательная функция для установки значения переданного ref.
 *
 * @typeParam T - Тип элемента, на который ссылается ref.
 * @param ref - Ref-объект или callback, который необходимо обновить.
 * @param node - Новое значение узла (элемент DOM или `null`).
 */
const setRef = <T>(ref: null | Ref<T> | undefined, node: null | T): void => {
	if (typeof ref === "function") {
		ref(node)
	} else if (ref) {
		Object.assign(ref, {
			current: node,
		})
	}
}

/**
 * Хук, объединяющий два ref в один callback-ref.
 *
 * @remarks
 * Позволяет передавать один callback-ref вместо двух отдельных ref-объектов.
 * Полезен, когда необходимо одновременно прикрепить ссылку на DOM-элемент
 * к нескольким потребителям (например, forwarded ref и внутренний ref).
 *
 * @typeParam T - Тип элемента, на который ссылаются ref.
 * @param firstRef - Первый ref-объект или callback.
 * @param secondRef - Второй ref-объект или callback.
 * @returns Callback-ref, который при вызове обновляет оба переданных ref.
 *
 * @example
 * ```tsx
 * const Component = React.forwardRef<HTMLDivElement>((props, forwardedRef) => {
 *   const internalRef = useRef<HTMLDivElement>(null)
 *   const combinedRef = useCombinedRefs(forwardedRef, internalRef)
 *
 *   return <div ref={combinedRef} {...props} />
 * })
 * ```
 */
export const useCombinedRefs = <T>(
	firstRef: null | Ref<T> | undefined,
	secondRef: null | Ref<T> | undefined,
): RefCallback<T> => {
	return useCallback(
		(node: null | T) => {
			setRef(firstRef, node)
			setRef(secondRef, node)
		},
		[firstRef, secondRef],
	)
}
