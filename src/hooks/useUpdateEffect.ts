import { type DependencyList, type EffectCallback, useEffect, useRef } from "react"

/**
 * Сравнивает зависимости по тем же базовым правилам, что и React:
 * длина массива должна совпадать, значения сравниваются через Object.is.
 */
const areDependenciesEqual = (previousDependencies: DependencyList, nextDependencies: DependencyList): boolean => {
	return (
		previousDependencies.length === nextDependencies.length &&
		previousDependencies.every((dependency, index) => Object.is(dependency, nextDependencies[index]))
	)
}

/**
 * Выполняет эффект при изменении зависимостей, пропуская монтирование.
 *
 * @param effect - Эффект, выполняемый при изменении зависимостей.
 * @param dependencies - Массив зависимостей эффекта.
 */
export const useUpdateEffect = (effect: EffectCallback, dependencies: DependencyList): void => {
	const effectRef = useRef(effect)
	const previousDependenciesRef = useRef<DependencyList | null>(null)
	const cleanupRef = useRef<ReturnType<EffectCallback>>(undefined)

	/*
	 * Обновляется перед основным эффектом, поэтому при изменении зависимостей
	 * будет вызвана актуальная версия callback.
	 */
	useEffect(() => {
		effectRef.current = effect
	})

	/*
	 * Намеренно запускается после каждого render.
	 * Необходимость запуска пользовательского эффекта определяется вручную.
	 */
	useEffect(() => {
		const previousDependencies = previousDependenciesRef.current

		previousDependenciesRef.current = dependencies

		if (previousDependencies === null || areDependenciesEqual(previousDependencies, dependencies)) {
			return
		}

		if (cleanupRef.current) {
			cleanupRef.current()
		}

		const cleanup = effectRef.current()

		cleanupRef.current = typeof cleanup === "function" ? cleanup : undefined
	})

	/*
	 * Выполняет последнюю cleanup-функцию при размонтировании.
	 */
	useEffect(
		() => () => {
			if (cleanupRef.current) {
				cleanupRef.current()
			}

			cleanupRef.current = undefined
		},
		[],
	)
}
