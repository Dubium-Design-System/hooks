import { useCallback, useState } from "react"

/**
 * Опции для хука useCounter.
 */
interface UseCounterOptions {
	/** Максимальное допустимое значение. */
	max?: number
	/** Минимальное допустимое значение. */
	min?: number
	/** Шаг изменения значения. По умолчанию 1. */
	step?: number
}

/**
 * Хук-счётчик с поддержкой шагов и границ (min/max).
 *
 * @param initialValue Начальное значение счётчика (по умолчанию 0)
 * @param options Настройки шага и границ счётчика
 * @returns Объект с текущим значением, функциями увеличения, уменьшения и сброса
 */
export const useCounter = (initialValue = 0, options: UseCounterOptions = { step: 1 }) => {
	const step = options.step ?? 1
	const [count, setCount] = useState(initialValue)

	/**
	 * Увеличивает значение счётчика на шаг, но не выше max.
	 */
	const increment = useCallback(() => {
		setCount((prev) => {
			const next = prev + step
			return options.max !== undefined && next > options.max ? prev : next
		})
	}, [step, options.max])

	/**
	 * Уменьшает значение счётчика на шаг, но не ниже min.
	 */
	const decrement = useCallback(() => {
		setCount((prev) => {
			const next = prev - step
			return options.min !== undefined && next < options.min ? prev : next
		})
	}, [step, options.min])

	/**
	 * Сбрасывает значение счётчика к начальному.
	 */
	const reset = useCallback(() => {
		setCount(initialValue)
	}, [initialValue])

	return { count, increment, decrement, reset }
}
