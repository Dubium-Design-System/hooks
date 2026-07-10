import { useState } from "react"

interface PreviousState<T> {
	current: T
	previous: T | undefined
}

/**
 * Хук для отслеживания предыдущего значения между рендерами с возможностью
 * указания начального значения.
 *
 * @template T - Тип отслеживаемого значения
 * @param {T} value - Текущее значение для отслеживания
 * @param {T} [initialValue] - Опциональное начальное значение
 * @returns {T} Предыдущее значение (initialValue при первом рендере)
 *
 * @example
 * // Базовое использование без initialValue
 * const prevCount = usePrevious(count); // undefined при первом рендере
 *
 * @example
 * // С начальным значением
 * const prevUser = usePrevious(user, { id: 0, name: 'Гость' });
 *
 * @example
 * // Типизированный вариант
 * const prevValue = usePrevious<string>(value, 'default');
 */

export const usePrevious = <T>(value: T, initialValue?: T): T | undefined => {
	const [state, setState] = useState<PreviousState<T>>({
		current: value,
		previous: initialValue,
	})

	if (!Object.is(state.current, value)) {
		setState({
			current: value,
			previous: state.current,
		})
	}

	return state.previous
}
