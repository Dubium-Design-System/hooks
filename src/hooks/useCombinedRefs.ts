import { type Ref, type RefCallback, useCallback, useEffect, useLayoutEffect, useRef } from "react"

/**
 * Возможное значение ref: callback, объект, null или undefined.
 */
export type TPossibleRef<T> = null | Ref<T> | undefined

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

/**
 * Устанавливает значение callback-ref или object-ref.
 *
 * @param ref - Обновляемый ref.
 * @param value - Новое значение ref.
 */
const setRef = <T>(ref: TPossibleRef<T>, value: null | T): void => {
	if (typeof ref === "function") {
		ref(value)

		return
	}

	if (ref) {
		Object.assign(ref, {
			current: value,
		})
	}
}

/**
 * Проверяет наличие ref в массиве по ссылочному равенству.
 *
 * @param refs - Массив ref-ов для поиска.
 * @param targetRef - Искомый ref.
 * @returns `true`, если ref найден в массиве.
 */
const includesRef = <T>(refs: readonly TPossibleRef<T>[], targetRef: TPossibleRef<T>): boolean => {
	return refs.some((ref) => Object.is(ref, targetRef))
}

/**
 * Объединяет несколько refs в один стабильный callback ref.
 *
 * При изменении списка refs:
 * - удалённые refs получают null;
 * - добавленные refs получают текущий DOM-элемент.
 *
 * @param refs - Список объединяемых refs.
 * @returns Стабильный callback ref.
 */
export const useCombinedRefs = <T>(...refs: TPossibleRef<T>[]): RefCallback<T> => {
	const refsRef = useRef<readonly TPossibleRef<T>[]>(refs)
	const nodeRef = useRef<null | T>(null)

	const combinedRef = useCallback<RefCallback<T>>((node) => {
		nodeRef.current = node

		refsRef.current.forEach((ref) => {
			setRef(ref, node)
		})
	}, [])

	useIsomorphicLayoutEffect(() => {
		const previousRefs = refsRef.current
		const currentNode = nodeRef.current

		previousRefs.forEach((previousRef) => {
			if (!includesRef(refs, previousRef)) {
				setRef(previousRef, null)
			}
		})

		refs.forEach((currentRef) => {
			if (!includesRef(previousRefs, currentRef)) {
				setRef(currentRef, currentNode)
			}
		})

		refsRef.current = refs
	})

	return combinedRef
}
