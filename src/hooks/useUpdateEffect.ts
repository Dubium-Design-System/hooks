import { type DependencyList, useEffect, useRef } from "react"

type CleanupFn = () => void
type EffectFn = () => CleanupFn | void

const areDependenciesEqual = (previousDeps: DependencyList, nextDeps: DependencyList): boolean => {
	return (
		previousDeps.length === nextDeps.length &&
		previousDeps.every((dependency, index) => Object.is(dependency, nextDeps[index]))
	)
}

/**
 * Хук, имитирующий поведение componentDidUpdate.
 *
 * Выполняет функцию `fn` только при обновлении зависимостей, пропуская первый рендер (монтаж).
 *
 * @param fn - Функция-эффект, вызываемая при изменении зависимостей (кроме первого рендера).
 *             Может возвращать функцию очистки.
 * @param deps - Массив зависимостей, при изменении которых будет вызван `fn`.
 *
 * @example
 * useUpdateEffect(() => {
 *   console.log('Это не сработает при первом рендере, но сработает при обновлениях deps');
 * }, [someValue]);
 */
export const useUpdateEffect = (fn: EffectFn, deps: DependencyList): void => {
	const mountedRef = useRef(false)
	const previousDepsRef = useRef<DependencyList>([])
	const cleanupRef = useRef<CleanupFn | undefined>(undefined)

	useEffect(() => {
		if (!mountedRef.current) {
			mountedRef.current = true
			previousDepsRef.current = [...deps]
		} else if (!areDependenciesEqual(previousDepsRef.current, deps)) {
			cleanupRef.current?.()
			cleanupRef.current = undefined

			previousDepsRef.current = [...deps]

			const cleanup = fn()

			if (cleanup) {
				cleanupRef.current = cleanup
			}
		}
	})

	useEffect(() => {
		return () => {
			cleanupRef.current?.()
		}
	}, [])
}
