import {
	type ChangeEventHandler,
	type ClipboardEventHandler,
	type FocusEventHandler,
	type InputHTMLAttributes,
	type KeyboardEventHandler,
	type RefCallback,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"

/**
 * Тип вводимых символов: только цифры или буквы/цифры.
 */
export type TPinInputType = "alphanumeric" | "numeric"

/**
 * Массив значений полей PIN-кода.
 */
export type TPinInputValues = string[]

/** Нативные свойства input, исключая переопределяемые. */
type TNativeInputProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	| "autoComplete"
	| "disabled"
	| "inputMode"
	| "maxLength"
	| "onBlur"
	| "onChange"
	| "onFocus"
	| "onKeyDown"
	| "onPaste"
	| "placeholder"
	| "ref"
	| "type"
	| "value"
>

/**
 * Свойства отдельного поля ввода PIN-кода.
 */
export interface IPinInputFieldProps extends TNativeInputProps {
	autoComplete: "off" | "one-time-code"
	disabled: boolean
	inputMode: "numeric" | "text"
	maxLength: number
	onBlur?: FocusEventHandler<HTMLInputElement>
	onChange?: ChangeEventHandler<HTMLInputElement>
	onFocus?: FocusEventHandler<HTMLInputElement>
	onKeyDown?: KeyboardEventHandler<HTMLInputElement>
	onPaste?: ClipboardEventHandler<HTMLInputElement>
	placeholder: string
	ref: RefCallback<HTMLInputElement>
	type: "password" | "text"
	value: string
}

/**
 * Опции хука `usePinInput`.
 */
export interface IUsePinInputOptions {
	/** Флаг автоматического фокуса на первом поле. */
	autoFocus?: boolean
	/** Задержка перед вызовом onComplete после заполнения всех полей. */
	completeDelay?: number
	/** Значение по умолчанию. */
	defaultValue?: readonly string[]
	/** Флаг отключения полей ввода. */
	disabled?: boolean
	/** Флаг фокуса на первом пустом поле при invalid. */
	focusOnInvalid?: boolean
	/** Флаг невалидного состояния. */
	invalid?: boolean
	/** Количество полей PIN-кода. */
	length?: number
	/** Флаг маскирования ввода (password). */
	mask?: boolean
	/** Колбэк при полном заполнении PIN-кода. */
	onComplete?: (value: string) => void
	/** Колбэк при изменении значения. */
	onValueChange?: (values: TPinInputValues) => void
	/** Флаг OTP-автозаполнения. */
	otp?: boolean
	/** Placeholder для пустых полей. */
	placeholder?: string
	/** Тип вводимых символов. */
	type?: TPinInputType
	/** Контролируемое значение. */
	value?: readonly string[]
}

/**
 * Опции для очистки полей PIN-кода.
 */
export interface IPinInputClearOptions {
	/** Флаг фокуса на первом поле после очистки. */
	focus?: boolean
}

/**
 * Возвращаемое значение хука `usePinInput`.
 */
export interface IUsePinInputReturn {
	/** Убирает фокус со всех полей. */
	blur: VoidFunction
	/** Очищает все поля. */
	clear: (options?: IPinInputClearOptions) => void
	/** Массив свойств для полей ввода. */
	fields: IPinInputFieldProps[]
	/** Устанавливает фокус на указанное поле. */
	focus: (index?: number) => void
	/** Индекс поля, находящегося в фокусе. */
	focusedIndex: number
	/** Флаг полного заполнения PIN-кода. */
	isComplete: boolean
	/** Флаг наличия фокуса на любом из полей. */
	isFocused: boolean
	/** Текущее значение PIN-кода. */
	value: TPinInputValues
}

/**
 * Нормализует длину PIN-кода.
 *
 * @param length - Исходная длина.
 * @returns Нормализованная длина (минимум 1).
 */
const normalizeLength = (length: number): number => {
	if (Number.isFinite(length)) {
		return Math.max(1, Math.floor(length))
	}

	return 1
}

/**
 * Создаёт массив пустых значений для полей PIN-кода.
 *
 * @param length - Количество полей.
 * @returns Массив пустых строк.
 */
const createEmptyValues = (length: number): TPinInputValues => {
	return Array.from({ length }, () => "")
}

/**
 * Нормализует введённые символы в соответствии с типом PIN-кода.
 *
 * @param rawValue - Исходное значение.
 * @param type - Тип PIN-кода (numeric или alphanumeric).
 * @returns Отфильтрованные и нормализованные символы.
 */
const normalizeCharacters = (rawValue: string, type: TPinInputType): string => {
	const pattern = type === "numeric" ? /\d/u : /[a-z\d]/iu
	const normalizedValue = Array.from(rawValue)
		.filter((character) => pattern.test(character))
		.join("")

	if (type === "alphanumeric") {
		return normalizedValue.toUpperCase()
	}

	return normalizedValue
}

/**
 * Нормализует массив значений в соответствии с длиной и типом PIN-кода.
 *
 * @param values - Исходный массив значений.
 * @param length - Требуемая длина.
 * @param type - Тип PIN-кода.
 * @returns Нормализованный массив значений.
 */
const normalizeValues = (values: readonly string[], length: number, type: TPinInputType): TPinInputValues => {
	return Array.from({ length }, (_, index) => normalizeCharacters(values[index] ?? "", type).slice(-1))
}

/**
 * Ограничивает индекс в диапазоне [0, length - 1].
 *
 * @param index - Исходный индекс.
 * @param length - Длина массива.
 * @returns Ограниченный индекс.
 */
const clampIndex = (index: number, length: number): number => {
	return Math.min(Math.max(Math.floor(index), 0), Math.max(length - 1, 0))
}

/**
 * Хук для управления PIN-кодом (OTP-вводом).
 *
 * Предоставляет массив полей ввода с автоматической навигацией,
 * поддержкой вставки, маскирования, автозаполнения OTP-кодов
 * и колбэком при завершении ввода.
 *
 * @param options - Опции PIN-ввода.
 * @returns Объект с полями ввода и методами управления.
 */
export const usePinInput = ({
	autoFocus = false,
	completeDelay = 0,
	defaultValue = [],
	disabled = false,
	focusOnInvalid = false,
	invalid = false,
	length = 6,
	mask = false,
	onComplete,
	onValueChange,
	otp = false,
	placeholder = "○",
	type = "numeric",
	value: controlledValue,
}: IUsePinInputOptions = {}): IUsePinInputReturn => {
	/** Безопасная длина PIN-кода. */
	const safeLength = normalizeLength(length)
	/** Безопасная задержка completeDelay. */
	const safeCompleteDelay = Number.isFinite(completeDelay) ? Math.max(0, completeDelay) : 0
	/** Флаг контролируемого режима. */
	const controlled = controlledValue !== undefined
	/** Внутреннее состояние значений. */
	const [internalValue, setInternalValue] = useState<TPinInputValues>(() =>
		normalizeValues(defaultValue, safeLength, type),
	)
	/** Индекс поля в фокусе. */
	const [focusedIndex, setFocusedIndex] = useState(-1)
	/** Ref для хранения ссылок на DOM-элементы полей ввода. */
	const inputsRef = useRef<Array<HTMLInputElement | null>>([])
	/** Ref для хранения актуального колбэка onComplete. */
	const onCompleteRef = useRef(onComplete)
	/** Ref для хранения актуального колбэка onValueChange. */
	const onValueChangeRef = useRef(onValueChange)
	/** Ref для хранения последнего завершённого значения. */
	const lastCompletedValueRef = useRef("")
	/** Текущие значения полей, нормализованные. */
	const values = normalizeValues(controlled ? controlledValue : internalValue, safeLength, type)
	/** Полная строка PIN-кода. */
	const completeValue = values.join("")
	/** Флаг полного заполнения всех полей. */
	const isComplete = values.every(Boolean)

	useEffect(() => {
		onCompleteRef.current = onComplete
	}, [onComplete])

	useEffect(() => {
		onValueChangeRef.current = onValueChange
	}, [onValueChange])

	/** Массив ref callback-ов для каждого поля ввода. */
	const fieldRefs = useMemo(
		() =>
			Array.from({ length: safeLength }, (_, index): RefCallback<HTMLInputElement> => {
				return (node) => {
					inputsRef.current[index] = node
				}
			}),
		[safeLength],
	)

	/** Устанавливает фокус на указанное поле. */
	const focus = useCallback(
		(index?: number): void => {
			if (disabled) {
				return
			}

			const firstEmptyIndex = values.findIndex((value) => value === "")
			const requestedIndex = index ?? (firstEmptyIndex === -1 ? safeLength - 1 : firstEmptyIndex)
			const inputElement = inputsRef.current[clampIndex(requestedIndex, safeLength)]

			if (inputElement) {
				inputElement.focus()
			}
		},
		[disabled, safeLength, values],
	)

	/** Убирает фокус со всех полей. */
	const blur = useCallback((): void => {
		inputsRef.current.forEach((input) => {
			if (input) {
				input.blur()
			}
		})
	}, [])

	/** Применяет новые значения к полям. */
	const commit = useCallback(
		(nextValues: readonly string[]): void => {
			const normalizedValues = normalizeValues(nextValues, safeLength, type)

			if (!controlled) {
				setInternalValue(normalizedValues)
			}

			if (onValueChangeRef.current) {
				onValueChangeRef.current(normalizedValues)
			}
		},
		[controlled, safeLength, type],
	)

	/** Очищает все поля PIN-кода. */
	const clear = useCallback(
		({ focus: shouldFocus = false }: IPinInputClearOptions = {}): void => {
			commit(createEmptyValues(safeLength))
			lastCompletedValueRef.current = ""

			if (shouldFocus) {
				const firstInput = inputsRef.current[0]

				if (firstInput) {
					firstInput.focus()
				}
			} else {
				blur()
			}
		},
		[blur, commit, safeLength],
	)

	useEffect(() => {
		if (autoFocus && !disabled) {
			const firstInput = inputsRef.current[0]

			if (firstInput) {
				firstInput.focus()
			}
		}
	}, [autoFocus, disabled])

	useEffect(() => {
		if (invalid && focusOnInvalid && !disabled) {
			const firstEmptyIndex = values.findIndex((value) => value === "")
			const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex
			const inputElement = inputsRef.current[targetIndex]

			if (inputElement) {
				inputElement.focus()
			}
		}
	}, [disabled, focusOnInvalid, invalid, values])

	useEffect(() => {
		if (!isComplete) {
			lastCompletedValueRef.current = ""

			return undefined
		}

		if (completeValue === lastCompletedValueRef.current) {
			return undefined
		}

		/** Уведомляет о завершении ввода PIN-кода. */
		const notifyComplete = (): void => {
			lastCompletedValueRef.current = completeValue

			if (onCompleteRef.current) {
				onCompleteRef.current(completeValue)
			}
		}

		if (safeCompleteDelay === 0) {
			notifyComplete()

			return undefined
		}

		const timeoutId = setTimeout(notifyComplete, safeCompleteDelay)

		return () => {
			clearTimeout(timeoutId)
		}
	}, [completeValue, isComplete, safeCompleteDelay])

	/** Формирует массив свойств для полей ввода. */
	const fields = values.map((fieldValue, index): IPinInputFieldProps => {
		/** Обработчик изменения значения поля. */
		const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
			const incomingValue = normalizeCharacters(event.currentTarget.value, type)
			const nextValues = [...values]

			if (incomingValue.length === 0) {
				nextValues[index] = ""
				commit(nextValues)

				return
			}

			const characters = incomingValue.slice(0, safeLength - index).split("")
			characters.forEach((character, characterIndex) => {
				nextValues[index + characterIndex] = character
			})
			commit(nextValues)

			const nextIndex = Math.min(index + characters.length, safeLength - 1)
			const nextInput = inputsRef.current[nextIndex]

			if (nextInput) {
				nextInput.focus()
			}
		}

		/** Обработчик вставки из буфера обмена. */
		const handlePaste: ClipboardEventHandler<HTMLInputElement> = (event) => {
			const pastedValue = normalizeCharacters(event.clipboardData.getData("text"), type)

			if (!pastedValue) {
				return
			}

			event.preventDefault()
			const nextValues = [...values]
			const characters = pastedValue.slice(0, safeLength - index).split("")

			characters.forEach((character, characterIndex) => {
				nextValues[index + characterIndex] = character
			})
			commit(nextValues)

			const firstEmptyIndex = nextValues.findIndex((value) => value === "")
			const targetIndex = firstEmptyIndex === -1 ? safeLength - 1 : firstEmptyIndex
			const targetInput = inputsRef.current[targetIndex]

			if (targetInput) {
				targetInput.focus()
			}
		}

		/** Обработчик нажатия клавиш. */
		const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
			if (event.key === "ArrowLeft") {
				event.preventDefault()
				const leftInput = inputsRef.current[clampIndex(index - 1, safeLength)]

				if (leftInput) {
					leftInput.focus()
				}

				return
			}

			if (event.key === "ArrowRight") {
				event.preventDefault()
				const rightInput = inputsRef.current[clampIndex(index + 1, safeLength)]

				if (rightInput) {
					rightInput.focus()
				}

				return
			}

			if (event.key === "Home") {
				event.preventDefault()
				const firstInput = inputsRef.current[0]

				if (firstInput) {
					firstInput.focus()
				}

				return
			}

			if (event.key === "End") {
				event.preventDefault()
				const lastInput = inputsRef.current[safeLength - 1]

				if (lastInput) {
					lastInput.focus()
				}

				return
			}

			if (event.key === "Delete") {
				event.preventDefault()
				const nextValues = [...values]
				nextValues[index] = ""
				commit(nextValues)

				return
			}

			if (event.key === "Backspace") {
				event.preventDefault()
				const nextValues = [...values]
				const targetIndex = nextValues[index] ? index : clampIndex(index - 1, safeLength)

				nextValues[targetIndex] = ""
				commit(nextValues)

				const backspaceTarget = inputsRef.current[targetIndex]

				if (backspaceTarget) {
					backspaceTarget.focus()
				}
			}
		}

		return {
			autoComplete: otp && index === 0 ? "one-time-code" : "off",
			disabled,
			inputMode: type === "numeric" ? "numeric" : "text",
			maxLength: otp && index === 0 ? safeLength : 1,
			onBlur: disabled ? undefined : () => setFocusedIndex(-1),
			onChange: disabled ? undefined : handleChange,
			onFocus: disabled
				? undefined
				: (event) => {
						setFocusedIndex(index)
						event.currentTarget.select()
					},
			onKeyDown: disabled ? undefined : handleKeyDown,
			onPaste: disabled ? undefined : handlePaste,
			placeholder: focusedIndex === -1 ? placeholder : "",
			ref: fieldRefs[index],
			type: mask ? "password" : "text",
			value: fieldValue,
		}
	})

	return {
		blur,
		clear,
		fields,
		focus,
		focusedIndex,
		isComplete,
		isFocused: focusedIndex !== -1,
		value: values,
	}
}
