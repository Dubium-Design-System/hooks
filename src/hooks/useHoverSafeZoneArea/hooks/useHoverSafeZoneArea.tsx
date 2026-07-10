import {
	type ReactNode,
	type PointerEvent as ReactPointerEvent,
	type RefCallback,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"

import type {
	HoverSafeZoneOrigin,
	HoverSafeZoneOverlayState,
	Point,
	UseHoverSafeZoneAreaOptions,
	UseHoverSafeZoneAreaResult,
} from "../useHoverSafeZoneArea.types"

import { HoverSafeZoneAreaOverlay } from "../components/HoverSafeZoneAreaOverlay"
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
import { getPointerLeaveAction, getReactPointerData, isSupportedPointerType } from "../utils/pointer"
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect"
import { useResolvedHoverSafeZoneAreaOptions } from "./useResolvedHoverSafeZoneAreaOptions"

type WindowWithResizeObserver = {
	ResizeObserver?: typeof ResizeObserver
} & Window

type LogEvent = (area: string, event: string, details?: unknown) => void

/**
 * Возвращает document, которому принадлежит элемент,
 * или глобальный document.
 *
 * @param element DOM-элемент или null.
 * @returns Document или null при SSR.
 */
const getOwnerDocument = (element: HTMLElement | null): Document | null => {
	if (element) {
		return element.ownerDocument
	}

	return typeof document === "undefined" ? null : document
}

/**
 * Возвращает window, которому принадлежит элемент,
 * или глобальный window.
 *
 * @param element DOM-элемент или null.
 * @returns WindowWithResizeObserver или null при SSR.
 */
const getOwnerWindow = (element: HTMLElement | null): null | WindowWithResizeObserver => {
	const ownerDocument = getOwnerDocument(element)

	return ownerDocument?.defaultView ?? (typeof window === "undefined" ? null : window)
}

export const useHoverSafeZoneArea = (options: UseHoverSafeZoneAreaOptions): UseHoverSafeZoneAreaResult => {
	const resolvedOptions = useResolvedHoverSafeZoneAreaOptions(options)

	const optionsRef = useRef(resolvedOptions)
	const targetElementRef = useRef<HTMLElement | null>(null)
	const containerElementRef = useRef<HTMLElement | null>(null)
	const svgRef = useRef<null | SVGSVGElement>(null)
	const pathRef = useRef<null | SVGPathElement>(null)
	const mouseRef = useRef<Point>([0, 0])
	const originRef = useRef<HoverSafeZoneOrigin>("target")
	const timeoutTimerRef = useRef<null | number>(null)
	const updateFrameRef = useRef<null | number>(null)
	const overlayStateRef = useRef<HoverSafeZoneOverlayState | null>(null)
	const isSafeZoneEnteredRef = useRef(false)

	const [targetElement, setTargetElementState] = useState<HTMLElement | null>(null)

	const [containerElement, setContainerElementState] = useState<HTMLElement | null>(null)

	const [overlayState, setOverlayState] = useState<HoverSafeZoneOverlayState | null>(null)

	useIsomorphicLayoutEffect(() => {
		optionsRef.current = resolvedOptions
	}, [resolvedOptions])

	const targetRef: RefCallback<HTMLElement> = useCallback((element) => {
		if (targetElementRef.current === element) {
			return
		}

		targetElementRef.current = element
		setTargetElementState(element)
	}, [])

	const containerRef: RefCallback<HTMLElement> = useCallback((element) => {
		if (containerElementRef.current === element) {
			return
		}

		containerElementRef.current = element
		setContainerElementState(element)
	}, [])

	const logEvent = useCallback<LogEvent>(() => undefined, [])

	const updateOverlayState = useCallback((nextOverlayState: HoverSafeZoneOverlayState | null) => {
		if (isSameOverlayState(overlayStateRef.current, nextOverlayState)) {
			return
		}

		overlayStateRef.current = nextOverlayState

		setOverlayState(nextOverlayState)
	}, [])

	const clearCloseTimeout = useCallback(() => {
		const ownerWindow = getOwnerWindow(targetElementRef.current ?? containerElementRef.current)

		if (!ownerWindow || timeoutTimerRef.current === null) {
			return
		}

		ownerWindow.clearTimeout(timeoutTimerRef.current)

		timeoutTimerRef.current = null
		logEvent("timeout", "clear")
	}, [logEvent])

	const cancelOverlayUpdate = useCallback(() => {
		const ownerWindow = getOwnerWindow(targetElementRef.current ?? containerElementRef.current)

		if (!ownerWindow || updateFrameRef.current === null) {
			return
		}

		ownerWindow.cancelAnimationFrame(updateFrameRef.current)

		updateFrameRef.current = null
		logEvent("overlay", "cancel-update")
	}, [logEvent])

	const stopSafeZoneTimers = useCallback(() => {
		clearCloseTimeout()
		cancelOverlayUpdate()
	}, [cancelOverlayUpdate, clearCloseTimeout])

	const hideSafeZone = useCallback(() => {
		isSafeZoneEnteredRef.current = false
		stopSafeZoneTimers()
		updateOverlayState(null)

		logEvent("lifecycle", "hide", {
			mouse: mouseRef.current,
		})
	}, [logEvent, stopSafeZoneTimers, updateOverlayState])

	const isPointerEventAllowed = useCallback(
		(event: Pick<PointerEvent, "pointerType"> | Pick<ReactPointerEvent<SVGPathElement>, "pointerType">): boolean =>
			isSupportedPointerType(event, optionsRef.current.pointerTypes),
		[],
	)

	const handleTimeoutClose = useCallback(() => {
		timeoutTimerRef.current = null
		isSafeZoneEnteredRef.current = false

		updateOverlayState(null)
		cancelOverlayUpdate()

		logEvent("timeout", "timeout-close", {
			mouse: mouseRef.current,
		})

		optionsRef.current.onTimeout?.()
		optionsRef.current.onRequestClose?.()
	}, [cancelOverlayUpdate, logEvent, updateOverlayState])

	const resetCloseTimeout = useCallback(() => {
		clearCloseTimeout()

		const currentOptions = optionsRef.current

		const ownerWindow = getOwnerWindow(targetElementRef.current ?? containerElementRef.current)

		if (!ownerWindow || !currentOptions.isActive || currentOptions.isDisabled || currentOptions.timeout <= 0) {
			logEvent("timeout", "skip", {
				mouse: mouseRef.current,
			})

			return
		}

		logEvent("timeout", "set", {
			mouse: mouseRef.current,
		})

		timeoutTimerRef.current = ownerWindow.setTimeout(handleTimeoutClose, currentOptions.timeout)
	}, [clearCloseTimeout, logEvent, handleTimeoutClose])

	const updateSafeZone = useCallback(() => {
		const target = targetElementRef.current
		const container = containerElementRef.current
		const currentOptions = optionsRef.current

		if (!currentOptions.isActive || currentOptions.isDisabled || !target || !container) {
			logEvent("overlay", "update-skip", {
				mouse: mouseRef.current,
				extra: {
					hasTargetElement: Boolean(target),
					hasContainerElement: Boolean(container),
				},
			})

			updateOverlayState(null)

			return
		}

		const result = createSafeZoneOverlayState({
			targetElement: target,
			containerElement: container,
			padding: currentOptions.padding,
			mouse: mouseRef.current,
			origin: originRef.current,
		})

		if (!result) {
			logEvent("overlay", "update-invalid", {
				mouse: mouseRef.current,
			})

			updateOverlayState(null)

			return
		}

		updateOverlayState(result.overlayState)

		logEvent("overlay", "update", {
			mouse: mouseRef.current,
			overlayState: result.overlayState,
			extra: {
				placementSide: result.placementSide,
				relativeMouse: result.relativeMouse,
			},
		})
	}, [logEvent, updateOverlayState])

	const scheduleUpdateSafeZone = useCallback(() => {
		cancelOverlayUpdate()

		const currentOptions = optionsRef.current

		const ownerWindow = getOwnerWindow(targetElementRef.current ?? containerElementRef.current)

		if (!ownerWindow || !currentOptions.isActive || currentOptions.isDisabled) {
			logEvent("overlay", "schedule-skip", {
				mouse: mouseRef.current,
			})

			return
		}

		logEvent("overlay", "schedule", {
			mouse: mouseRef.current,
		})

		updateFrameRef.current = ownerWindow.requestAnimationFrame(() => {
			updateFrameRef.current = null

			updateSafeZone()
		})
	}, [cancelOverlayUpdate, logEvent, updateSafeZone])

	const requestClose = useCallback(() => {
		logEvent("close", "request-close", {
			mouse: mouseRef.current,
		})

		hideSafeZone()
		optionsRef.current.onRequestClose?.()
	}, [logEvent, hideSafeZone])

	const activateSafeZone = useCallback(
		(event: PointerEvent, origin: HoverSafeZoneOrigin) => {
			const currentOptions = optionsRef.current

			if (!isPointerEventAllowed(event) || !currentOptions.isActive || currentOptions.isDisabled) {
				logEvent(origin, "activate-skip", {
					mouse: getPoint(event),
					point: getPointerCoordinates(event),
					extra: {
						pointerType: event.pointerType,
					},
				})

				return
			}

			const mouse = getPoint(event)

			originRef.current = origin
			mouseRef.current = mouse

			logEvent(origin, "activate", {
				mouse,
				point: getPointerCoordinates(event),
				extra: { origin },
			})

			resetCloseTimeout()
			scheduleUpdateSafeZone()
		},
		[logEvent, isPointerEventAllowed, resetCloseTimeout, scheduleUpdateSafeZone],
	)

	const handleTargetPointerEnter = useCallback(
		(event: PointerEvent) => {
			if (!isPointerEventAllowed(event)) {
				return
			}

			mouseRef.current = getPoint(event)
			originRef.current = "target"

			hideSafeZone()

			logEvent("target", "pointer-enter", {
				mouse: mouseRef.current,
				point: getPointerCoordinates(event),
			})
		},
		[logEvent, hideSafeZone, isPointerEventAllowed],
	)

	const handleTargetPointerMove = useCallback(
		(event: PointerEvent) => {
			if (!isPointerEventAllowed(event)) {
				return
			}

			mouseRef.current = getPoint(event)
			originRef.current = "target"

			clearCloseTimeout()
			scheduleUpdateSafeZone()

			logEvent("target", "pointer-move", {
				mouse: mouseRef.current,
				point: getPointerCoordinates(event),
			})
		},
		[clearCloseTimeout, logEvent, isPointerEventAllowed, scheduleUpdateSafeZone],
	)

	const handleTargetPointerLeave = useCallback(
		(event: PointerEvent) => {
			if (!isPointerEventAllowed(event)) {
				return
			}

			const target = targetElementRef.current

			const container = containerElementRef.current

			const point = getPointerCoordinates(event)

			const mouse = getPoint(event)

			mouseRef.current = mouse
			originRef.current = "target"

			if (!target || !container) {
				logEvent("target", "pointer-leave-no-elements", {
					mouse,
					point,
				})

				requestClose()

				return
			}

			logEvent("target", "pointer-leave", {
				mouse,
				point,
				extra: {
					hasTarget: Boolean(target),
					hasContainer: Boolean(container),
				},
			})

			activateSafeZone(event, "target")
		},
		[activateSafeZone, logEvent, isPointerEventAllowed, requestClose],
	)

	const handleContainerPointerEnter = useCallback(
		(event: PointerEvent) => {
			if (!isPointerEventAllowed(event)) {
				return
			}

			mouseRef.current = getPoint(event)

			hideSafeZone()

			logEvent("container", "pointer-enter", {
				mouse: mouseRef.current,
				point: getPointerCoordinates(event),
			})
		},
		[logEvent, hideSafeZone, isPointerEventAllowed],
	)

	const handleContainerPointerMove = useCallback(
		(event: PointerEvent) => {
			if (!isPointerEventAllowed(event)) {
				return
			}

			mouseRef.current = getPoint(event)

			clearCloseTimeout()

			logEvent("container", "pointer-move", {
				mouse: mouseRef.current,
				point: getPointerCoordinates(event),
			})
		},
		[clearCloseTimeout, logEvent, isPointerEventAllowed],
	)

	const handleContainerPointerLeave = useCallback(
		(event: PointerEvent) => {
			if (!isPointerEventAllowed(event)) {
				return
			}

			const target = targetElementRef.current

			const container = containerElementRef.current

			const point = getPointerCoordinates(event)

			const mouse = getPoint(event)

			mouseRef.current = mouse
			originRef.current = "container"

			if (!target || !container) {
				logEvent("container", "pointer-leave-no-elements", {
					mouse,
					point,
				})

				requestClose()

				return
			}

			logEvent("container", "pointer-leave", {
				mouse,
				point,
				extra: {
					hasTarget: Boolean(target),
					hasContainer: Boolean(container),
				},
			})

			activateSafeZone(event, "container")
		},
		[activateSafeZone, logEvent, isPointerEventAllowed, requestClose],
	)

	const handleDocumentPointerMove = useCallback(
		(event: PointerEvent) => {
			if (!isPointerEventAllowed(event)) {
				return
			}

			const currentOverlayState = overlayStateRef.current

			const currentOptions = optionsRef.current

			const target = targetElementRef.current

			const container = containerElementRef.current

			if (
				!currentOverlayState ||
				!currentOptions.isActive ||
				currentOptions.isDisabled ||
				!target ||
				!container
			) {
				return
			}

			const point = getPointerCoordinates(event)

			const mouse = getPoint(event)

			if (isPointInsideElement(target, point)) {
				mouseRef.current = mouse
				originRef.current = "target"

				clearCloseTimeout()
				scheduleUpdateSafeZone()

				logEvent("document", "pointer-move-target", { mouse, point })

				return
			}

			if (isPointInsideElement(container, point)) {
				mouseRef.current = mouse

				hideSafeZone()

				logEvent("document", "pointer-move-container", {
					mouse,
					point,
				})

				return
			}

			if (isPointInsideExpandedElement(container, point, currentOptions.padding)) {
				mouseRef.current = mouse

				resetCloseTimeout()
				scheduleUpdateSafeZone()

				logEvent("document", "pointer-move-expanded-container", {
					mouse,
					point,
				})

				return
			}

			if (!isPointInsideOverlayBounds(currentOverlayState, point)) {
				logEvent("document", "pointer-move-outside-bounds", {
					mouse,
					point,
				})

				requestClose()

				return
			}

			const svgElement = svgRef.current
			const pathElement = pathRef.current

			const isInsideSafeZone =
				svgElement && pathElement
					? isPointInsideSvgPath({
							svgElement,
							pathElement,
							point,
						})
					: null

			logEvent("document", "pointer-move", {
				mouse,
				point,
				extra: {
					isInsideSafeZone,
				},
			})

			if (isInsideSafeZone === null) {
				return
			}

			if (!isInsideSafeZone) {
				isSafeZoneEnteredRef.current = false

				requestClose()

				return
			}

			mouseRef.current = mouse
			resetCloseTimeout()

			if (!isSafeZoneEnteredRef.current) {
				isSafeZoneEnteredRef.current = true

				currentOptions.onSafeZoneEnter?.()
			}

			currentOptions.onSafeZoneMove?.()
			scheduleUpdateSafeZone()
		},
		[
			clearCloseTimeout,
			logEvent,
			hideSafeZone,
			isPointerEventAllowed,
			requestClose,
			resetCloseTimeout,
			scheduleUpdateSafeZone,
		],
	)

	const handleSafeZonePointerEnter = useCallback(
		(event: ReactPointerEvent<SVGPathElement>) => {
			event.stopPropagation()

			if (!isPointerEventAllowed(event)) {
				return
			}

			const { mouse, point } = getReactPointerData(event)

			mouseRef.current = mouse
			resetCloseTimeout()

			logEvent("safe-zone", "pointer-enter", { mouse, point })

			optionsRef.current.onSafeZoneEnter?.()
		},
		[logEvent, isPointerEventAllowed, resetCloseTimeout],
	)

	const handleSafeZonePointerMove = useCallback(
		(event: ReactPointerEvent<SVGPathElement>) => {
			event.stopPropagation()

			if (!isPointerEventAllowed(event)) {
				return
			}

			const { mouse, point } = getReactPointerData(event)

			mouseRef.current = mouse
			resetCloseTimeout()

			logEvent("safe-zone", "pointer-move", { mouse, point })

			optionsRef.current.onSafeZoneMove?.()
			scheduleUpdateSafeZone()
		},
		[logEvent, isPointerEventAllowed, resetCloseTimeout, scheduleUpdateSafeZone],
	)

	const handleSafeZonePointerLeave = useCallback(
		(event: ReactPointerEvent<SVGPathElement>) => {
			event.stopPropagation()

			if (!isPointerEventAllowed(event)) {
				return
			}

			const { point, mouse } = getReactPointerData(event)

			const action = getPointerLeaveAction({
				targetElement: targetElementRef.current,
				containerElement: containerElementRef.current,
				padding: optionsRef.current.padding,
				point,
			})

			mouseRef.current = mouse

			logEvent("safe-zone", "pointer-leave", {
				mouse,
				point,
				extra: { action },
			})

			if (action === "target") {
				originRef.current = "target"
				hideSafeZone()

				return
			}

			if (action === "container") {
				hideSafeZone()

				return
			}

			if (action === "expanded-container") {
				resetCloseTimeout()
				scheduleUpdateSafeZone()

				return
			}

			requestClose()
		},
		[
			clearCloseTimeout,
			logEvent,
			hideSafeZone,
			isPointerEventAllowed,
			requestClose,
			resetCloseTimeout,
			scheduleUpdateSafeZone,
		],
	)

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

	useEffect(() => {
		if (!resolvedOptions.isActive || resolvedOptions.isDisabled || !targetElement || !containerElement) {
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
		targetElement,
	])

	useEffect(() => {
		if (!resolvedOptions.isActive || resolvedOptions.isDisabled || !overlayState) {
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
	}, [handleDocumentPointerMove, overlayState, resolvedOptions.isActive, resolvedOptions.isDisabled, targetElement])

	useEffect(() => {
		if (!resolvedOptions.isActive || resolvedOptions.isDisabled || !overlayState) {
			return undefined
		}

		const ownerWindow = getOwnerWindow(targetElement)

		if (!ownerWindow) {
			return undefined
		}

		const handleWindowUpdate = () => {
			if (!overlayStateRef.current || !optionsRef.current.isActive || optionsRef.current.isDisabled) {
				return
			}

			logEvent("lifecycle", "window-update", {
				mouse: mouseRef.current,
			})

			scheduleUpdateSafeZone()
		}

		ownerWindow.addEventListener("resize", handleWindowUpdate)

		ownerWindow.addEventListener("scroll", handleWindowUpdate, true)

		ownerWindow.visualViewport?.addEventListener("resize", handleWindowUpdate)

		ownerWindow.visualViewport?.addEventListener("scroll", handleWindowUpdate)

		return () => {
			ownerWindow.removeEventListener("resize", handleWindowUpdate)

			ownerWindow.removeEventListener("scroll", handleWindowUpdate, true)

			ownerWindow.visualViewport?.removeEventListener("resize", handleWindowUpdate)

			ownerWindow.visualViewport?.removeEventListener("scroll", handleWindowUpdate)
		}
	}, [
		logEvent,
		overlayState,
		resolvedOptions.isActive,
		resolvedOptions.isDisabled,
		scheduleUpdateSafeZone,
		targetElement,
	])

	useEffect(() => {
		if (
			!resolvedOptions.isActive ||
			resolvedOptions.isDisabled ||
			!overlayState ||
			!targetElement ||
			!containerElement
		) {
			return undefined
		}

		const ownerWindow = getOwnerWindow(targetElement)

		const ResizeObserverConstructor: typeof ResizeObserver | undefined =
			ownerWindow?.ResizeObserver ?? (typeof ResizeObserver === "undefined" ? undefined : ResizeObserver)

		if (!ResizeObserverConstructor) {
			return undefined
		}

		const handleElementResize = () => {
			if (!overlayStateRef.current || !optionsRef.current.isActive || optionsRef.current.isDisabled) {
				return
			}

			logEvent("lifecycle", "element-resize", {
				mouse: mouseRef.current,
			})

			scheduleUpdateSafeZone()
		}

		const resizeObserver = new ResizeObserverConstructor(handleElementResize)

		resizeObserver.observe(targetElement)
		resizeObserver.observe(containerElement)

		return () => {
			resizeObserver.disconnect()
		}
	}, [
		containerElement,
		logEvent,
		overlayState,
		resolvedOptions.isActive,
		resolvedOptions.isDisabled,
		scheduleUpdateSafeZone,
		targetElement,
	])

	useEffect(() => {
		if (targetElement && containerElement) {
			return undefined
		}

		hideSafeZone()

		return undefined
	}, [containerElement, hideSafeZone, targetElement])

	useEffect(() => {
		if (resolvedOptions.isActive && !resolvedOptions.isDisabled) {
			return undefined
		}

		isSafeZoneEnteredRef.current = false
		stopSafeZoneTimers()
		updateOverlayState(null)

		return undefined
	}, [resolvedOptions.isActive, resolvedOptions.isDisabled, stopSafeZoneTimers, updateOverlayState])

	useEffect(
		() => () => {
			stopSafeZoneTimers()
		},
		[stopSafeZoneTimers],
	)

	const elementToRender = useMemo<ReactNode>(() => {
		if (resolvedOptions.isDisabled) {
			return null
		}

		return (
			<HoverSafeZoneAreaOverlay
				onSafeZonePointerEnter={handleSafeZonePointerEnter}
				onSafeZonePointerLeave={handleSafeZonePointerLeave}
				onSafeZonePointerMove={handleSafeZonePointerMove}
				overlayState={resolvedOptions.isActive ? overlayState : null}
				pathRef={pathRef}
				svgRef={svgRef}
			/>
		)
	}, [
		handleSafeZonePointerEnter,
		handleSafeZonePointerLeave,
		handleSafeZonePointerMove,
		overlayState,
		resolvedOptions.isActive,
		resolvedOptions.isDisabled,
	])

	return {
		targetRef,
		containerRef,
		elementToRender,
	}
}
