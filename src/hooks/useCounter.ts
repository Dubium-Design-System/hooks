import { type SetStateAction, useCallback, useMemo, useState } from "react"

/**
 * Опции хука `useCounter`.
 */
export interface IUseCounterOptions {
	/** Начальное значение счётчика. */
	initialValue?: number
	/** Максимальное значение счётчика. */
	max?: number
	/** Минимальное значение счётчика. */
	min?: number
	/** Шаг изменения счётчика. */
	step?: number
}

/**
 * Возвращаемое значение хука `useCounter`.
 */
export interface IUseCounterReturn {
	/** Флаг возможности уменьшения значения. */
	canDecrement: boolean
	/** Флаг возможности увеличения значения. */
	canIncrement: boolean
	/** Уменьшает значение счётчика на указанную величину. */
	decrement: (amount?: number) => void
	/** Увеличивает значение счётчика на указанную величину. */
	increment: (amount?: number) => void
	/** Сбрасывает значение счётчика к начальному. */
	reset: VoidFunction
	/** Устанавливает произвольное значение счётчика. */
	setValue: (value: SetStateAction<number>) => void
	/** Текущее значение счётчика. */
	value: number
}

/**
 * Приводит значение к конечному числу или возвращает запасное значение.
 *
 * @param value - Проверяемое значение.
 * @param fallback - Значение по умолчанию.
 * @returns Конечное число или fallback.
 */
const toFiniteNumber = (value: number | undefined, fallback: number): number => {
	if (value !== undefined && Number.isFinite(value)) {
		return value
	}

	return fallback
}

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
 * Хук для управления числовым счётчиком с ограничениями.
 *
 * Предоставляет методы increment, decrement, reset и setValue
 * с автоматическим ограничением в заданных пределах min/max.
 *
 * @param options - Опции счётчика.
 * @returns Объект с состоянием и методами управления счётчиком.
 */
export const useCounter = ({
	initialValue = 0,
	max = Number.POSITIVE_INFINITY,
	min = Number.NEGATIVE_INFINITY,
	step = 1,
}: IUseCounterOptions = {}): IUseCounterReturn => {
	/** Вычисленные границы с учётом приоритета min/max. */
	const bounds = useMemo(() => {
		const first = toFiniteNumber(min, Number.NEGATIVE_INFINITY)
		const second = toFiniteNumber(max, Number.POSITIVE_INFINITY)

		return {
			max: Math.max(first, second),
			min: Math.min(first, second),
		}
	}, [max, min])

	/** Безопасный шаг (положительное конечное число). */
	const safeStep = Math.abs(toFiniteNumber(step, 1))
	/** Значение для сброса, ограниченное границами. */
	const resetValue = clamp(toFiniteNumber(initialValue, 0), bounds.min, bounds.max)
	/** Внутреннее состояние счётчика. */
	const [storedValue, setStoredValue] = useState(resetValue)
	/** Текущее значение, ограниченное границами. */
	const value = clamp(storedValue, bounds.min, bounds.max)

	/** Устанавливает значение счётчика с проверкой границ. */
	const setCounterValue = useCallback(
		(nextValue: SetStateAction<number>): void => {
			setStoredValue((currentStoredValue) => {
				const currentValue = clamp(currentStoredValue, bounds.min, bounds.max)
				const resolvedValue = typeof nextValue === "function" ? nextValue(currentValue) : nextValue

				return clamp(toFiniteNumber(resolvedValue, currentValue), bounds.min, bounds.max)
			})
		},
		[bounds.max, bounds.min],
	)

	/** Увеличивает значение счётчика. */
	const increment = useCallback(
		(amount = safeStep): void => {
			setCounterValue((currentValue) => currentValue + Math.abs(toFiniteNumber(amount, safeStep)))
		},
		[safeStep, setCounterValue],
	)

	/** Уменьшает значение счётчика. */
	const decrement = useCallback(
		(amount = safeStep): void => {
			setCounterValue((currentValue) => currentValue - Math.abs(toFiniteNumber(amount, safeStep)))
		},
		[safeStep, setCounterValue],
	)

	/** Сбрасывает значение счётчика к начальному. */
	const reset = useCallback((): void => {
		setCounterValue(resetValue)
	}, [resetValue, setCounterValue])

	return {
		canDecrement: value > bounds.min,
		canIncrement: value < bounds.max,
		decrement,
		increment,
		reset,
		setValue: setCounterValue,
		value,
	}
}
