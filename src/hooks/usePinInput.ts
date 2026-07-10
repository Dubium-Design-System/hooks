import {
	type InputHTMLAttributes,
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react"

/**
 * Массив значений для каждого поля ввода PIN.
 */
type PinInputValues = string[]

type NativeInputProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	| "autoComplete"
	| "disabled"
	| "inputMode"
	| "onBlur"
	| "onFocus"
	| "onInput"
	| "onKeyDown"
	| "onPaste"
	| "placeholder"
	| "ref"
	| "type"
	| "value"
>

type PinInputHandler = NonNullable<InputHTMLAttributes<HTMLInputElement>["onInput"]>

type PinInputKeyboardHandler = NonNullable<InputHTMLAttributes<HTMLInputElement>["onKeyDown"]>

type PinInputFocusHandler = NonNullable<InputHTMLAttributes<HTMLInputElement>["onFocus"]>

type PinInputBlurHandler = NonNullable<InputHTMLAttributes<HTMLInputElement>["onBlur"]>

type PinInputPasteHandler = NonNullable<InputHTMLAttributes<HTMLInputElement>["onPaste"]>

/**
 * Действия, доступные извне через `ref`.
 */
export interface PinInputActions {
	/**
	 * Убрать фокус со всех полей.
	 */
	blur: () => void

	/**
	 * Установить фокус на поле.
	 *
	 * @param index Индекс поля, по умолчанию 0.
	 */
	focus: (index?: number) => void
}

/**
 * Опции хука `usePinInput`.
 */
export interface UsePinInputProps {
	/**
	 * Ссылка на методы управления фокусом.
	 */
	actionRef?: Ref<PinInputActions>

	/**
	 * Автоматически установить фокус на первое поле.
	 */
	autoFocus?: boolean

	/**
	 * Задержка перед вызовом `onComplete`.
	 */
	completeDelay?: number

	/**
	 * Значения по умолчанию для неконтролируемого режима.
	 *
	 * @example Array(4).fill("")
	 */
	defaultValues?: PinInputValues

	/**
	 * Отключить все поля ввода.
	 */
	disabled?: boolean

	/**
	 * Индикатор ошибки.
	 */
	error?: boolean

	/**
	 * Фокусировать первое пустое поле при ошибке.
	 */
	focusFirstEmptyOnError?: boolean

	/**
	 * Количество полей.
	 */
	length?: number

	/**
	 * Скрывать символы ввода.
	 */
	mask?: boolean

	/**
	 * Колбэк при изменении значений.
	 *
	 * @param values Текущие значения полей.
	 */
	onChange?: (values: PinInputValues) => void

	/**
	 * Колбэк при полном заполнении всех полей.
	 *
	 * @param value Объединённое значение PIN-кода.
	 */
	onComplete?: (value: string) => void

	/**
	 * Использовать автозаполнение OTP.
	 */
	otp?: boolean

	/**
	 * Символ-плейсхолдер для пустых полей.
	 */
	placeholder?: string

	/**
	 * Тип ввода.
	 */
	type?: "alphanumeric" | "numeric"

	/**
	 * Значения для контролируемого режима.
	 */
	values?: PinInputValues
}

/**
 * Опции для метода очистки полей.
 */
export interface PinInputClearOptions {
	/**
	 * Установить фокус на первое поле после очистки.
	 */
	focus?: boolean
}

/**
 * Свойства отдельного поля PIN-ввода.
 */
export interface PinInputFieldProps extends NativeInputProps {
	autoComplete: "off" | "one-time-code"
	disabled: boolean
	inputMode: "numeric" | "text"
	onBlur?: PinInputBlurHandler
	onFocus?: PinInputFocusHandler
	onInput?: PinInputHandler
	onKeyDown?: PinInputKeyboardHandler
	onPaste?: PinInputPasteHandler
	placeholder: string

	/**
	 * Реф для установки ссылки на поле.
	 */
	ref: (node: HTMLInputElement | null) => void

	type: "password" | "text"

	/**
	 * Значение поля.
	 */
	value: string
}

/**
 * Создаёт массив пустых строк заданной длины.
 */
const createEmptyValues = (length: number): PinInputValues => Array.from({ length }, () => "")

/**
 * Приводит массив значений к указанной длине.
 *
 * Существующие значения сохраняются, недостающие заполняются пустыми строками.
 */
const resizeValues = (values: PinInputValues, length: number): PinInputValues =>
	Array.from({ length }, (_, index) => values[index] ?? "")

/**
 * Ограничивает индекс допустимым диапазоном.
 */
const clampIndex = (index: number, length: number): number => {
	if (length <= 0) return 0

	return Math.min(Math.max(index, 0), length - 1)
}

/**
 * Хук для создания PIN/OTP-ввода с фокусом, маской,
 * валидацией и колбэком при завершении ввода.
 */
export const usePinInput = ({
	values: valuesProp,
	length = 6,
	onChange: onChangeProp,
	onComplete,
	completeDelay = 0,
	actionRef,
	autoFocus = false,
	defaultValues,
	type = "numeric",
	otp = false,
	placeholder = "○",
	disabled = false,
	mask = false,
	error = false,
	focusFirstEmptyOnError = error,
}: UsePinInputProps = {}) => {
	const isControlled = valuesProp !== undefined

	const [valuesState, setValuesState] = useState<PinInputValues>(() => resizeValues(defaultValues ?? [], length))

	const [focusedIndex, setFocusedIndex] = useState(-1)

	/*
	 * Не обновляем state при изменении length.
	 * Нужная длина вычисляется для текущего рендера.
	 */
	const values = resizeValues(isControlled ? valuesProp : valuesState, length)

	const isTypeAlphanumeric = type === "alphanumeric"

	const fieldRef = useRef<Array<HTMLInputElement | null>>(createEmptyValues(values.length).map(() => null))

	const lastCompleteValueRef = useRef("")

	useEffect(() => {
		fieldRef.current = fieldRef.current.slice(0, values.length)

		while (fieldRef.current.length < values.length) {
			fieldRef.current.push(null)
		}
	}, [values.length])

	/**
	 * Устанавливает фокус на поле с указанным индексом.
	 */
	const setFocus = useCallback((index = 0): void => {
		if (fieldRef.current.length === 0) return

		const nextIndex = clampIndex(index, fieldRef.current.length)

		fieldRef.current[nextIndex]?.focus()
	}, [])

	/**
	 * Убирает фокус с активного поля.
	 */
	const setBlur = useCallback((): void => {
		if (focusedIndex === -1) return

		fieldRef.current[focusedIndex]?.blur()
	}, [focusedIndex])

	useEffect(() => {
		if (autoFocus) {
			setFocus()
		}
	}, [autoFocus, setFocus])

	useImperativeHandle(
		actionRef,
		() => ({
			focus: (index = 0) => {
				const emptyIndex = values.findIndex((value) => !value)

				const nextIndex = focusFirstEmptyOnError && emptyIndex !== -1 ? emptyIndex : index

				setFocus(nextIndex)
			},
			blur: setBlur,
		}),
		[focusFirstEmptyOnError, setBlur, setFocus, values],
	)

	/**
	 * Создаёт callback-ref для поля.
	 */
	const setFieldRef = useCallback(
		(index: number) =>
			(node: HTMLInputElement | null): void => {
				fieldRef.current[index] = node
			},
		[],
	)

	/**
	 * Обновляет значения полей.
	 */
	const updateValues = useCallback(
		(nextValues: PinInputValues): void => {
			if (!isControlled) {
				setValuesState(nextValues)
			}

			onChangeProp?.(nextValues)
		},
		[isControlled, onChangeProp],
	)

	/**
	 * Нормализует введённое значение.
	 */
	const normalizeValue = useCallback(
		(rawValue: string): null | string => {
			let value = rawValue.trim()

			const regex = isTypeAlphanumeric ? /^[a-z\d]*$/iu : /^\d*$/u

			if (!regex.test(value)) return null

			if (isTypeAlphanumeric) {
				value = value.toUpperCase()
			}

			return value
		},
		[isTypeAlphanumeric],
	)

	/**
	 * Нормализует вставленное значение.
	 */
	const normalizePastedValue = useCallback(
		(rawValue: string): null | string => {
			const value = rawValue.replace(/[\s-]/gu, "")

			return normalizeValue(value)
		},
		[normalizeValue],
	)

	/**
	 * Перемещает фокус на следующее поле.
	 */
	const focusNextField = useCallback(
		(index: number, nextValues: PinInputValues): void => {
			if (index >= nextValues.length - 1) return

			if (focusFirstEmptyOnError) {
				const emptyIndex = nextValues.findIndex((value) => !value)

				if (emptyIndex !== -1) {
					setFocus(emptyIndex)
				}

				return
			}

			setFocus(index + 1)
		},
		[focusFirstEmptyOnError, setFocus],
	)

	/**
	 * Создаёт обработчик ввода.
	 */
	const onInput = useCallback(
		(index: number): PinInputHandler =>
			(event) => {
				let value = normalizeValue(event.currentTarget.value)

				if (value === null) return

				if (value.length === values.length) {
					updateValues(value.split(""))
					return
				}

				if (value.length === 2) {
					const currentValue = values[index]

					if (!value.includes(currentValue)) {
						return
					}

					value = value.replace(currentValue, "")
				}

				if (value.length > 1) return

				const nextValues = [...values]

				nextValues[index] = value
				updateValues(nextValues)

				if (value) {
					focusNextField(index, nextValues)
				}
			},
		[focusNextField, normalizeValue, updateValues, values],
	)

	/**
	 * Создаёт обработчик вставки.
	 */
	const onPaste = useCallback(
		(index: number): PinInputPasteHandler =>
			(event) => {
				const pastedValue = normalizePastedValue(event.clipboardData.getData("text"))

				if (!pastedValue) return

				event.preventDefault()

				const nextValues = [...values]

				const chars = pastedValue.slice(0, values.length - index).split("")

				chars.forEach((char, charIndex) => {
					nextValues[index + charIndex] = char
				})

				updateValues(nextValues)

				const emptyIndex = nextValues.findIndex((value) => !value)

				if (emptyIndex !== -1) {
					setFocus(emptyIndex)
					return
				}

				setFocus(index + chars.length - 1)
			},
		[normalizePastedValue, setFocus, updateValues, values],
	)

	/**
	 * Создаёт обработчик нажатия клавиш.
	 */
	const onKeyDown = useCallback(
		(index: number): PinInputKeyboardHandler =>
			(event) => {
				if (event.key === "Backspace" && !values[index] && index > 0) {
					setFocus(index - 1)
				}
			},
		[setFocus, values],
	)

	/**
	 * Очищает все поля.
	 */
	const clear = useCallback(
		({ focus = false }: PinInputClearOptions = {}): void => {
			updateValues(createEmptyValues(values.length))

			lastCompleteValueRef.current = ""

			if (focus) {
				setFocus()
			} else {
				setBlur()
			}
		},
		[setBlur, setFocus, updateValues, values.length],
	)

	/**
	 * Создаёт обработчик фокуса.
	 */
	const onFocus = useCallback(
		(index: number): PinInputFocusHandler =>
			() => {
				setFocusedIndex(index)
			},
		[],
	)

	/**
	 * Обрабатывает потерю фокуса.
	 */
	const onBlur = useCallback<PinInputBlurHandler>(() => {
		setFocusedIndex(-1)
	}, [])

	const hasFocus = focusedIndex !== -1

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout> | undefined

		const isFilled = values.every((value) => value !== "")

		const currentValue = values.join("")

		if (!isFilled) {
			lastCompleteValueRef.current = ""
		} else if (currentValue !== lastCompleteValueRef.current) {
			lastCompleteValueRef.current = currentValue

			if (completeDelay <= 0) {
				onComplete?.(currentValue)
			} else {
				timeoutId = setTimeout(() => {
					onComplete?.(currentValue)
				}, completeDelay)
			}
		}

		return () => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId)
			}
		}
	}, [completeDelay, onComplete, values])

	const fields: PinInputFieldProps[] = values.map((value, index) => ({
		ref: setFieldRef(index),
		value,
		disabled,
		autoComplete: otp ? "one-time-code" : "off",
		inputMode: isTypeAlphanumeric ? "text" : "numeric",
		type: mask ? "password" : "text",
		placeholder: hasFocus ? "" : placeholder,
		...(!disabled && {
			onFocus: onFocus(index),
			onBlur,
			onInput: onInput(index),
			onKeyDown: onKeyDown(index),
			onPaste: onPaste(index),
		}),
	}))

	return {
		fields,
		clear,
		isFocused: hasFocus,
	}
}

/**
 * Возвращаемый результат `usePinInput`.
 */
export type UsePinInputReturn = ReturnType<typeof usePinInput>
