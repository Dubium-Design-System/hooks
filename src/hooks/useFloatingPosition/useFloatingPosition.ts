import { type CSSProperties, type RefCallback, useCallback, useMemo, useRef, useState } from "react"

import type {
	IFloatingPositionResult,
	IFloatingResolvedOptions,
	IUseFloatingPositionOptions,
	IUseFloatingPositionReturn,
	TFloatingPlacement,
} from "./useFloatingPosition.types"

import { computeFloatingPosition } from "./compute/computeFloatingPosition"
import { useAnimationFrameUpdate } from "./hooks/useAnimationFrameUpdate"
import { useAutoUpdate } from "./hooks/useAutoUpdate"
import { useIsomorphicLayoutEffect } from "./hooks/useIsomorphicLayoutEffect"
import {
	DEFAULT_FLOATING_AUTO_UPDATE,
	DEFAULT_FLOATING_FLIP,
	DEFAULT_FLOATING_HIDE_WHEN_REFERENCE_HIDDEN,
	DEFAULT_FLOATING_MAX_HEIGHT,
	DEFAULT_FLOATING_OFFSET,
	DEFAULT_FLOATING_PADDING,
	DEFAULT_FLOATING_PLACEMENT,
	DEFAULT_FLOATING_SAME_WIDTH,
	DEFAULT_FLOATING_SHIFT,
	DEFAULT_FLOATING_STYLE,
} from "./useFloatingPosition.constants"

/**
 * Сравнивает два CSSProperties на идентичность.
 *
 * @param currentStyle - Текущий стиль.
 * @param nextStyle - Новый стиль.
 * @returns `true`, если стили идентичны.
 */
const isSameStyle = (currentStyle: CSSProperties, nextStyle: CSSProperties): boolean => {
	const currentKeys = Object.keys(currentStyle) as Array<keyof CSSProperties>

	const nextKeys = Object.keys(nextStyle) as Array<keyof CSSProperties>

	return currentKeys.length === nextKeys.length && nextKeys.every((key) => currentStyle[key] === nextStyle[key])
}

/**
 * Сравнивает два результата позиционирования.
 *
 * Используется, чтобы не обновлять состояние,
 * если результат позиционирования не изменился.
 *
 * @param currentResult - Текущий результат.
 * @param nextResult - Новый результат.
 * @returns `true`, если результаты идентичны.
 */
const isSamePositionResult = (
	currentResult: IFloatingPositionResult | null,
	nextResult: IFloatingPositionResult,
): boolean => {
	if (!currentResult) {
		return false
	}

	return (
		currentResult.x === nextResult.x &&
		currentResult.y === nextResult.y &&
		currentResult.placement === nextResult.placement &&
		currentResult.availableHeight === nextResult.availableHeight &&
		currentResult.isReferenceHidden === nextResult.isReferenceHidden &&
		isSameStyle(currentResult.style, nextResult.style)
	)
}

/**
 * Позиционирует floating-элемент относительно reference-элемента.
 *
 * Хук решает только задачу геометрического позиционирования:
 * рассчитывает координаты, применяет `flip`, `shift`, `offset`,
 * `sameWidth`, `maxHeight` и обновляет позицию при изменениях.
 *
 * Не отвечает за состояние Select/Dropdown, keyboard navigation,
 * focus management, outside click и hover safe-zone.
 *
 * @param options - Опции позиционирования floating-элемента.
 * @returns Refs, стили, placement и методы обновления позиции.
 */
export const useFloatingPosition = <
	TReference extends HTMLElement = HTMLElement,
	TFloating extends HTMLElement = HTMLElement,
>(
	options: IUseFloatingPositionOptions = {},
): IUseFloatingPositionReturn<TReference, TFloating> => {
	const {
		autoUpdate = DEFAULT_FLOATING_AUTO_UPDATE,
		flip = DEFAULT_FLOATING_FLIP,
		hideWhenReferenceHidden = DEFAULT_FLOATING_HIDE_WHEN_REFERENCE_HIDDEN,
		isDisabled = false,
		isOpen = true,
		maxHeight = DEFAULT_FLOATING_MAX_HEIGHT,
		offset = DEFAULT_FLOATING_OFFSET,
		onPositionChange,
		onReferenceHidden,
		padding = DEFAULT_FLOATING_PADDING,
		placement: preferredPlacement = DEFAULT_FLOATING_PLACEMENT,
		sameWidth = DEFAULT_FLOATING_SAME_WIDTH,
		shift = DEFAULT_FLOATING_SHIFT,
		zIndex,
	} = options

	/** Состояние reference-элемента. */
	const [referenceElement, setReferenceElement] = useState<null | TReference>(null)

	/** Состояние floating-элемента. */
	const [floatingElement, setFloatingElement] = useState<null | TFloating>(null)

	/** Текущий inline-style floating-элемента. */
	const [floatingStyle, setFloatingStyle] = useState<CSSProperties>(DEFAULT_FLOATING_STYLE)

	/** Текущий placement после применения flip. */
	const [placement, setPlacement] = useState<TFloatingPlacement>(preferredPlacement)

	/** Флаг скрытия reference-элемента. */
	const [isReferenceHidden, setIsReferenceHidden] = useState(false)

	/** Ref для хранения последнего результата позиционирования. */
	const latestResultRef = useRef<IFloatingPositionResult | null>(null)

	/** Ref для отслеживания предыдущего состояния скрытия reference. */
	const wasReferenceHiddenRef = useRef(false)

	/** Флаг активности позиционирования. */
	const positioningEnabled = isOpen && !isDisabled

	/** Мемоизированные нормализованные опции. */
	const resolvedOptions = useMemo<IFloatingResolvedOptions>(
		() => ({
			flip,
			hideWhenReferenceHidden,
			maxHeight,
			offset,
			padding,
			placement: preferredPlacement,
			sameWidth,
			shift,
			zIndex,
		}),
		[flip, hideWhenReferenceHidden, maxHeight, offset, padding, preferredPlacement, sameWidth, shift, zIndex],
	)

	/**
	 * Немедленно пересчитывает позицию floating-элемента.
	 */
	const forceUpdate = useCallback((): void => {
		if (!positioningEnabled || !referenceElement || !floatingElement) {
			latestResultRef.current = null
			wasReferenceHiddenRef.current = false

			return
		}

		const result = computeFloatingPosition({
			floatingElement,
			options: resolvedOptions,
			referenceElement,
		})

		const previousResult = latestResultRef.current

		const hasSameResult = isSamePositionResult(previousResult, result)

		latestResultRef.current = result

		if (!hasSameResult) {
			setFloatingStyle(result.style)
			setPlacement(result.placement)
			setIsReferenceHidden(result.isReferenceHidden)
		}

		if (result.isReferenceHidden && !wasReferenceHiddenRef.current) {
			if (onReferenceHidden) {
				onReferenceHidden()
			}
		}

		wasReferenceHiddenRef.current = result.isReferenceHidden

		if (onPositionChange) {
			onPositionChange(result)
		}
	}, [floatingElement, onPositionChange, onReferenceHidden, positioningEnabled, referenceElement, resolvedOptions])

	/** Хук для планирования обновлений через requestAnimationFrame. */
	const { cancelUpdate, scheduleUpdate } = useAnimationFrameUpdate(forceUpdate)

	/** Ref callback для reference-элемента. */
	const referenceRef: RefCallback<TReference> = useCallback((node) => {
		setReferenceElement(node)
	}, [])

	/** Ref callback для floating-элемента. */
	const floatingRef: RefCallback<TFloating> = useCallback((node) => {
		setFloatingElement(node)
	}, [])

	/** Автоматическое обновление позиции при scroll/resize/изменении размеров. */
	useAutoUpdate({
		enabled: positioningEnabled && autoUpdate,
		floatingElement,
		referenceElement,
		update: scheduleUpdate,
	})

	useIsomorphicLayoutEffect(() => {
		if (positioningEnabled) {
			scheduleUpdate()
		} else {
			cancelUpdate()

			latestResultRef.current = null
			wasReferenceHiddenRef.current = false
		}
	}, [cancelUpdate, positioningEnabled, scheduleUpdate])

	return {
		floatingElement,
		floatingRef,
		floatingStyle: positioningEnabled ? floatingStyle : DEFAULT_FLOATING_STYLE,
		forceUpdate,
		isReferenceHidden: positioningEnabled ? isReferenceHidden : false,
		placement: positioningEnabled ? placement : preferredPlacement,
		referenceElement,
		referenceRef,
		update: scheduleUpdate,
	}
}
