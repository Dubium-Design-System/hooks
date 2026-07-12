import { type RefCallback, useCallback, useEffect, useRef, useState } from "react"

import type {
	IHoverSafeZoneOverlayState,
	IUseHoverSafeZoneAreaOptions,
	IUseHoverSafeZoneAreaResult,
	THoverSafeZoneOrigin,
	TPoint,
} from "../useHoverSafeZoneArea.types"

import {
	createSafeZoneOverlayState,
	getPoint,
	getPointerCoordinates,
	isPointInsideElement,
	isPointInsideExpandedElement,
	isPointInsideOverlayBounds,
	isPointInsideSvgPath,
	isSameOverlayState,
} from "../utils/geometry"
import { isSupportedPointerType } from "../utils/pointer"
import { createHoverSafeZoneSvgHitTester } from "../utils/svgHitTester"
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect"
import { useResolvedHoverSafeZoneAreaOptions } from "./useResolvedHoverSafeZoneAreaOptions"

/** Window с возможным ResizeObserver. */
type TWindowWithResizeObserver = {
	ResizeObserver?: typeof ResizeObserver
} & Window

/**
 * Возвращает ownerDocument для элемента или document, если элемент не задан.
 *
 * @param element - DOM-элемент.
 * @returns Document или null.
 */
const getOwnerDocument = (element: HTMLElement | null): Document | null => {
	return element?.ownerDocument ?? (typeof document === "undefined" ? null : document)
}

/**
 * Возвращает ownerWindow для элемента или window, если элемент не задан.
 *
 * @param element - DOM-элемент.
 * @returns Window или null.
 */
const getOwnerWindow = (element: HTMLElement | null): null | TWindowWithResizeObserver => {
	return getOwnerDocument(element)?.defaultView ?? (typeof window === "undefined" ? null : window)
}

/**
 * Хук для создания безопасной зоны при наведении.
 *
 * Создаёт невидимую область между target- и container-элементами,
 * предотвращающую ложное закрытие всплывающих элементов.
 * SVG для hit-test создаётся и удаляется внутри хука автоматически.
 *
 * @param options - Опции безопасной зоны.
 * @returns Ref callback-и для target и container элементов.
 */
export const useHoverSafeZoneArea = (options: IUseHoverSafeZoneAreaOptions): IUseHoverSafeZoneAreaResult => {
	/** Нормализованные опции. */
	const resolvedOptions = useResolvedHoverSafeZoneAreaOptions(options)
	/** Ref для хранения актуальных опций. */
	const optionsRef = useRef(resolvedOptions)
	/** Ref для хранения target-элемента. */
	const targetElementRef = useRef<HTMLElement | null>(null)
	/** Ref для хранения container-элемента. */
	const containerElementRef = useRef<HTMLElement | null>(null)
	/** Ref для хранения SVG hit-tester. */
	const svgHitTesterRef = useRef<null | ReturnType<typeof createHoverSafeZoneSvgHitTester>>(null)
	/** Ref для хранения текущей позиции указателя. */
	const mouseRef = useRef<TPoint>([0, 0])
	/** Ref для хранения источника активации safe-zone. */
	const originRef = useRef<THoverSafeZoneOrigin>("target")
	/** Ref для хранения идентификатора таймера закрытия. */
	const closeTimerRef = useRef<null | number>(null)
	/** Ref для хранения идентификатора animation frame. */
	const updateFrameRef = useRef<null | number>(null)
	/** Ref для хранения последнего состояния оверлея. */
	const overlayStateRef = useRef<IHoverSafeZoneOverlayState | null>(null)
	/** Ref для отслеживания входа в safe-zone. */
	const isSafeZoneEnteredRef = useRef(false)
	/** Состояние target-элемента. */
	const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
	/** Состояние container-элемента. */
	const [containerElement, setContainerElement] = useState<HTMLElement | null>(null)

	useIsomorphicLayoutEffect(() => {
		optionsRef.current = resolvedOptions
	}, [resolvedOptions])

	/** Ref callback для target-элемента. */
	const targetRef = useCallback<RefCallback<HTMLElement>>((node) => {
		targetElementRef.current = node
		setTargetElement(node)
	}, [])

	/** Ref callback для container-элемента. */
	const containerRef = useCallback<RefCallback<HTMLElement>>((node) => {
		containerElementRef.current = node
		setContainerElement(node)
	}, [])

	/** Обновляет состояние оверлея и SVG hit-tester. */
	const updateOverlayState = useCallback((nextState: IHoverSafeZoneOverlayState | null): void => {
		if (isSameOverlayState(overlayStateRef.current, nextState)) {
			return
		}

		overlayStateRef.current = nextState
		svgHitTesterRef.current?.update(nextState)
	}, [])

	/** Очищает таймер автоматического закрытия. */
	const clearCloseTimer = useCallback((): void => {
		const ownerWindow = getOwnerWindow(targetElementRef.current ?? containerElementRef.current)

		if (!ownerWindow || closeTimerRef.current === null) {
			return
		}

		ownerWindow.clearTimeout(closeTimerRef.current)
		closeTimerRef.current = null
	}, [])

	/** Отменяет запланированное обновление через animation frame. */
	const cancelScheduledUpdate = useCallback((): void => {
		const ownerWindow = getOwnerWindow(targetElementRef.current ?? containerElementRef.current)

		if (!ownerWindow || updateFrameRef.current === null) {
			return
		}

		ownerWindow.cancelAnimationFrame(updateFrameRef.current)
		updateFrameRef.current = null
	}, [])

	/** Скрывает safe-zone и очищает все таймеры. */
	const hideSafeZone = useCallback((): void => {
		isSafeZoneEnteredRef.current = false
		clearCloseTimer()
		cancelScheduledUpdate()
		updateOverlayState(null)
	}, [cancelScheduledUpdate, clearCloseTimer, updateOverlayState])

	/** Обработчик закрытия по таймауту. */
	const handleTimeoutClose = useCallback((): void => {
		closeTimerRef.current = null
		isSafeZoneEnteredRef.current = false
		cancelScheduledUpdate()
		updateOverlayState(null)
		optionsRef.current.onTimeout?.()
		optionsRef.current.onRequestClose?.()
	}, [cancelScheduledUpdate, updateOverlayState])

	/** Сбрасывает таймер автоматического закрытия. */
	const resetCloseTimer = useCallback((): void => {
		clearCloseTimer()

		const currentOptions = optionsRef.current
		const ownerWindow = getOwnerWindow(targetElementRef.current ?? containerElementRef.current)

		if (!ownerWindow || !currentOptions.isActive || currentOptions.isDisabled || currentOptions.timeout <= 0) {
			return
		}

		closeTimerRef.current = ownerWindow.setTimeout(handleTimeoutClose, currentOptions.timeout)
	}, [clearCloseTimer, handleTimeoutClose])

	/** Обновляет safe-zone на основе текущих позиций target и container. */
	const updateSafeZone = useCallback((): void => {
		const target = targetElementRef.current
		const container = containerElementRef.current
		const currentOptions = optionsRef.current

		if (!target || !container || !currentOptions.isActive || currentOptions.isDisabled) {
			updateOverlayState(null)

			return
		}

		const result = createSafeZoneOverlayState({
			containerElement: container,
			mouse: mouseRef.current,
			origin: originRef.current,
			padding: currentOptions.padding,
			targetElement: target,
		})

		updateOverlayState(result?.overlayState ?? null)
	}, [updateOverlayState])

	/** Планирует обновление safe-zone на следующий animation frame. */
	const scheduleSafeZoneUpdate = useCallback((): void => {
		cancelScheduledUpdate()

		const currentOptions = optionsRef.current
		const ownerWindow = getOwnerWindow(targetElementRef.current ?? containerElementRef.current)

		if (!ownerWindow || !currentOptions.isActive || currentOptions.isDisabled) {
			return
		}

		updateFrameRef.current = ownerWindow.requestAnimationFrame(() => {
			updateFrameRef.current = null
			updateSafeZone()
		})
	}, [cancelScheduledUpdate, updateSafeZone])

	/** Запрашивает закрытие safe-zone. */
	const requestClose = useCallback((): void => {
		hideSafeZone()
		optionsRef.current.onRequestClose?.()
	}, [hideSafeZone])

	/** Проверяет, разрешён ли тип указателя. */
	const isPointerAllowed = useCallback((event: Pick<PointerEvent, "pointerType">): boolean => {
		return isSupportedPointerType(event, optionsRef.current.pointerTypes)
	}, [])

	/** Активирует safe-zone при выходе указателя из элемента. */
	const activateSafeZone = useCallback(
		(event: PointerEvent, origin: THoverSafeZoneOrigin): void => {
			const currentOptions = optionsRef.current

			if (!isPointerAllowed(event) || !currentOptions.isActive || currentOptions.isDisabled) {
				return
			}

			originRef.current = origin
			mouseRef.current = getPoint(event)
			resetCloseTimer()
			scheduleSafeZoneUpdate()
		},
		[isPointerAllowed, resetCloseTimer, scheduleSafeZoneUpdate],
	)

	/** Обработчик pointerenter на target. */
	const handleTargetPointerEnter = useCallback(
		(event: PointerEvent): void => {
			if (!isPointerAllowed(event)) {
				return
			}

			mouseRef.current = getPoint(event)
			originRef.current = "target"
			hideSafeZone()
		},
		[hideSafeZone, isPointerAllowed],
	)

	/** Обработчик pointermove на target. */
	const handleTargetPointerMove = useCallback(
		(event: PointerEvent): void => {
			if (!isPointerAllowed(event)) {
				return
			}

			mouseRef.current = getPoint(event)
			originRef.current = "target"
			clearCloseTimer()
		},
		[clearCloseTimer, isPointerAllowed],
	)

	/** Обработчик pointerleave на target. */
	const handleTargetPointerLeave = useCallback(
		(event: PointerEvent): void => {
			if (!isPointerAllowed(event)) {
				return
			}

			if (!targetElementRef.current || !containerElementRef.current) {
				requestClose()

				return
			}

			activateSafeZone(event, "target")
		},
		[activateSafeZone, isPointerAllowed, requestClose],
	)

	/** Обработчик pointerenter на container. */
	const handleContainerPointerEnter = useCallback(
		(event: PointerEvent): void => {
			if (!isPointerAllowed(event)) {
				return
			}

			mouseRef.current = getPoint(event)
			hideSafeZone()
		},
		[hideSafeZone, isPointerAllowed],
	)

	/** Обработчик pointermove на container. */
	const handleContainerPointerMove = useCallback(
		(event: PointerEvent): void => {
			if (!isPointerAllowed(event)) {
				return
			}

			mouseRef.current = getPoint(event)
			clearCloseTimer()
		},
		[clearCloseTimer, isPointerAllowed],
	)

	/** Обработчик pointerleave на container. */
	const handleContainerPointerLeave = useCallback(
		(event: PointerEvent): void => {
			if (!isPointerAllowed(event)) {
				return
			}

			if (!targetElementRef.current || !containerElementRef.current) {
				requestClose()

				return
			}

			activateSafeZone(event, "container")
		},
		[activateSafeZone, isPointerAllowed, requestClose],
	)

	/** Обработчик pointermove на document для отслеживания safe-zone. */
	const handleDocumentPointerMove = useCallback(
		(event: PointerEvent): void => {
			if (!isPointerAllowed(event)) {
				return
			}

			const overlayState = overlayStateRef.current
			const target = targetElementRef.current
			const container = containerElementRef.current
			const currentOptions = optionsRef.current

			if (!overlayState || !target || !container || !currentOptions.isActive || currentOptions.isDisabled) {
				return
			}

			const point = getPointerCoordinates(event)

			if (isPointInsideElement(target, point) || isPointInsideElement(container, point)) {
				mouseRef.current = getPoint(event)
				hideSafeZone()

				return
			}

			const destinationElement = originRef.current === "target" ? container : target

			if (isPointInsideExpandedElement(destinationElement, point, currentOptions.padding)) {
				mouseRef.current = getPoint(event)
				resetCloseTimer()
				scheduleSafeZoneUpdate()

				return
			}

			if (!isPointInsideOverlayBounds(overlayState, point)) {
				requestClose()

				return
			}

			const svgHitTester = svgHitTesterRef.current

			if (
				!svgHitTester ||
				!isPointInsideSvgPath({
					pathElement: svgHitTester.pathElement,
					point,
					svgElement: svgHitTester.svgElement,
				})
			) {
				requestClose()

				return
			}

			mouseRef.current = getPoint(event)
			resetCloseTimer()

			if (!isSafeZoneEnteredRef.current) {
				isSafeZoneEnteredRef.current = true
				currentOptions.onSafeZoneEnter?.()
			}

			currentOptions.onSafeZoneMove?.()
			scheduleSafeZoneUpdate()
		},
		[hideSafeZone, isPointerAllowed, requestClose, resetCloseTimer, scheduleSafeZoneUpdate],
	)

	/** Эффект для создания SVG hit-tester. */
	useEffect(() => {
		if (!resolvedOptions.isActive || resolvedOptions.isDisabled || !targetElement || !containerElement) {
			return undefined
		}

		const ownerDocument = getOwnerDocument(targetElement)

		if (!ownerDocument?.body) {
			return undefined
		}

		const hitTester = createHoverSafeZoneSvgHitTester(ownerDocument)
		svgHitTesterRef.current = hitTester
		hitTester.update(overlayStateRef.current)

		return () => {
			if (svgHitTesterRef.current === hitTester) {
				svgHitTesterRef.current = null
			}

			hitTester.destroy()
		}
	}, [containerElement, resolvedOptions.isActive, resolvedOptions.isDisabled, targetElement])

	/** Эффект для подписки на события target. */
	useEffect(() => {
		if (!resolvedOptions.isActive || resolvedOptions.isDisabled || !targetElement) {
			return undefined
		}

		targetElement.addEventListener("pointerenter", handleTargetPointerEnter)
		targetElement.addEventListener("pointermove", handleTargetPointerMove)
		targetElement.addEventListener("pointerleave", handleTargetPointerLeave)

		return () => {
			targetElement.removeEventListener("pointerenter", handleTargetPointerEnter)
			targetElement.removeEventListener("pointermove", handleTargetPointerMove)
			targetElement.removeEventListener("pointerleave", handleTargetPointerLeave)
		}
	}, [
		handleTargetPointerEnter,
		handleTargetPointerLeave,
		handleTargetPointerMove,
		resolvedOptions.isActive,
		resolvedOptions.isDisabled,
		targetElement,
	])

	/** Эффект для подписки на события container. */
	useEffect(() => {
		if (!resolvedOptions.isActive || resolvedOptions.isDisabled || !containerElement) {
			return undefined
		}

		containerElement.addEventListener("pointerenter", handleContainerPointerEnter)
		containerElement.addEventListener("pointermove", handleContainerPointerMove)
		containerElement.addEventListener("pointerleave", handleContainerPointerLeave)

		return () => {
			containerElement.removeEventListener("pointerenter", handleContainerPointerEnter)
			containerElement.removeEventListener("pointermove", handleContainerPointerMove)
			containerElement.removeEventListener("pointerleave", handleContainerPointerLeave)
		}
	}, [
		containerElement,
		handleContainerPointerEnter,
		handleContainerPointerLeave,
		handleContainerPointerMove,
		resolvedOptions.isActive,
		resolvedOptions.isDisabled,
	])

	/** Эффект для подписки на pointermove на document. */
	useEffect(() => {
		if (!resolvedOptions.isActive || resolvedOptions.isDisabled || !targetElement || !containerElement) {
			return undefined
		}

		const ownerDocument = getOwnerDocument(targetElement)

		if (!ownerDocument) {
			return undefined
		}

		ownerDocument.addEventListener("pointermove", handleDocumentPointerMove)

		return () => {
			ownerDocument.removeEventListener("pointermove", handleDocumentPointerMove)
		}
	}, [
		containerElement,
		handleDocumentPointerMove,
		resolvedOptions.isActive,
		resolvedOptions.isDisabled,
		targetElement,
	])

	/** Эффект для отслеживания изменений геометрии (resize, scroll). */
	useEffect(() => {
		if (!resolvedOptions.isActive || resolvedOptions.isDisabled || !targetElement || !containerElement) {
			return undefined
		}

		const ownerWindow = getOwnerWindow(targetElement)

		if (!ownerWindow) {
			return undefined
		}

		/** Обработчик изменения геометрии. */
		const handleGeometryChange = (): void => {
			if (overlayStateRef.current) {
				scheduleSafeZoneUpdate()
			}
		}

		ownerWindow.addEventListener("resize", handleGeometryChange)
		ownerWindow.addEventListener("scroll", handleGeometryChange, true)
		ownerWindow.visualViewport?.addEventListener("resize", handleGeometryChange)
		ownerWindow.visualViewport?.addEventListener("scroll", handleGeometryChange)

		const ResizeObserverConstructor =
			ownerWindow.ResizeObserver ?? (typeof ResizeObserver === "undefined" ? undefined : ResizeObserver)
		const resizeObserver = ResizeObserverConstructor ? new ResizeObserverConstructor(handleGeometryChange) : null

		resizeObserver?.observe(targetElement)
		resizeObserver?.observe(containerElement)

		return () => {
			ownerWindow.removeEventListener("resize", handleGeometryChange)
			ownerWindow.removeEventListener("scroll", handleGeometryChange, true)
			ownerWindow.visualViewport?.removeEventListener("resize", handleGeometryChange)
			ownerWindow.visualViewport?.removeEventListener("scroll", handleGeometryChange)
			resizeObserver?.disconnect()
		}
	}, [containerElement, resolvedOptions.isActive, resolvedOptions.isDisabled, scheduleSafeZoneUpdate, targetElement])

	/** Эффект для скрытия safe-zone при деактивации. */
	useEffect(() => {
		if (targetElement && containerElement && resolvedOptions.isActive && !resolvedOptions.isDisabled) {
			return undefined
		}

		hideSafeZone()

		return undefined
	}, [containerElement, hideSafeZone, resolvedOptions.isActive, resolvedOptions.isDisabled, targetElement])

	/** Эффект очистки при размонтировании. */
	useEffect(
		() => () => {
			hideSafeZone()
		},
		[hideSafeZone],
	)

	return { containerRef, targetRef }
}
