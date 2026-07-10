import { type CSSProperties, type RefCallback, useCallback, useMemo, useRef, useState } from "react"

import type {
	FloatingPlacement,
	FloatingPositionResult,
	FloatingResolvedOptions,
	UseFloatingPositionOptions,
	UseFloatingPositionReturn,
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
	DEFAULT_FLOATING_STRATEGY,
	DEFAULT_FLOATING_STYLE,
} from "./useFloatingPosition.constants"

/**
 * Сравнивает два CSSProperties на идентичность.
 *
 * @param currentStyle Текущий стиль.
 * @param nextStyle Новый стиль.
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
 * @param currentResult Текущий результат.
 * @param nextResult Новый результат.
 * @returns `true`, если результаты идентичны.
 */
const isSamePositionResult = (
	currentResult: FloatingPositionResult | null,
	nextResult: FloatingPositionResult,
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
 * @param options Опции позиционирования floating-элемента.
 * @returns Refs, стили, placement и методы обновления позиции.
 */
export const useFloatingPosition = <
	TReference extends HTMLElement = HTMLElement,
	TFloating extends HTMLElement = HTMLElement,
>(
	options: UseFloatingPositionOptions = {},
): UseFloatingPositionReturn<TReference, TFloating> => {
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
		strategy = DEFAULT_FLOATING_STRATEGY,
		zIndex,
	} = options

	const [referenceElement, setReferenceElement] = useState<null | TReference>(null)

	const [floatingElement, setFloatingElement] = useState<null | TFloating>(null)

	const [floatingStyle, setFloatingStyle] = useState<CSSProperties>(DEFAULT_FLOATING_STYLE)

	const [placement, setPlacement] = useState<FloatingPlacement>(preferredPlacement)

	const [isReferenceHidden, setIsReferenceHidden] = useState(false)

	const latestResultRef = useRef<FloatingPositionResult | null>(null)

	const wasReferenceHiddenRef = useRef(false)

	const positioningEnabled = isOpen && !isDisabled

	const resolvedOptions = useMemo<FloatingResolvedOptions>(
		() => ({
			flip,
			hideWhenReferenceHidden,
			maxHeight,
			offset,
			padding,
			placement: preferredPlacement,
			sameWidth,
			shift,
			strategy,
			zIndex,
		}),
		[
			flip,
			hideWhenReferenceHidden,
			maxHeight,
			offset,
			padding,
			preferredPlacement,
			sameWidth,
			shift,
			strategy,
			zIndex,
		],
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
			onReferenceHidden?.()
		}

		wasReferenceHiddenRef.current = result.isReferenceHidden

		onPositionChange?.(result)
	}, [floatingElement, onPositionChange, onReferenceHidden, positioningEnabled, referenceElement, resolvedOptions])

	const { cancelUpdate, scheduleUpdate } = useAnimationFrameUpdate(forceUpdate)

	const referenceRef: RefCallback<TReference> = useCallback((node) => {
		setReferenceElement(node)
	}, [])

	const floatingRef: RefCallback<TFloating> = useCallback((node) => {
		setFloatingElement(node)
	}, [])

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
