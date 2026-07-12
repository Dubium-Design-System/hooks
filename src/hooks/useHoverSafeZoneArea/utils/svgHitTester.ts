import type { IHoverSafeZoneOverlayState } from "../useHoverSafeZoneArea.types"

import { HOVER_SAFE_ZONE_DATA_ATTRIBUTE } from "../useHoverSafeZoneArea.constants"

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

/**
 * Интерфейс для SVG hit-tester безопасной зоны.
 */
export interface IHoverSafeZoneSvgHitTester {
	/** Удаляет SVG-элемент из DOM. */
	destroy: VoidFunction
	/** SVGPathElement для hit-test. */
	pathElement: SVGPathElement
	/** Корневой SVG-элемент. */
	svgElement: SVGSVGElement
	/** Обновляет path и размеры SVG. */
	update: (overlayState: IHoverSafeZoneOverlayState | null) => void
}

/**
 * Создаёт невидимый SVG, используемый только для нативного hit-test
 * безопасной зоны через SVGGeometryElement.isPointInFill().
 */
export const createHoverSafeZoneSvgHitTester = (ownerDocument: Document): IHoverSafeZoneSvgHitTester => {
	const svgElement = ownerDocument.createElementNS(SVG_NAMESPACE, "svg")
	const pathElement = ownerDocument.createElementNS(SVG_NAMESPACE, "path")

	svgElement.setAttribute("aria-hidden", "true")
	svgElement.setAttribute("focusable", "false")
	svgElement.setAttribute(HOVER_SAFE_ZONE_DATA_ATTRIBUTE, "")

	Object.assign(svgElement.style, {
		position: "fixed",
		top: "0",
		left: "0",
		display: "block",
		overflow: "hidden",
		pointerEvents: "none",
		opacity: "0",
		border: "0",
		margin: "0",
		padding: "0",
	})

	pathElement.setAttribute("fill", "transparent")
	pathElement.setAttribute("stroke", "transparent")
	pathElement.setAttribute("stroke-width", "0")
	pathElement.setAttribute("pointer-events", "none")

	svgElement.append(pathElement)
	ownerDocument.body.append(svgElement)

	/** Обновляет path и размеры SVG. */
	const update = (overlayState: IHoverSafeZoneOverlayState | null) => {
		if (!overlayState) {
			svgElement.style.left = "0px"
			svgElement.style.top = "0px"
			svgElement.style.width = "0px"
			svgElement.style.height = "0px"
			svgElement.setAttribute("width", "0")
			svgElement.setAttribute("height", "0")
			svgElement.setAttribute("viewBox", "0 0 0 0")
			pathElement.removeAttribute("d")

			return
		}

		const { bounds, safeZonePath } = overlayState

		svgElement.style.left = `${bounds.left}px`
		svgElement.style.top = `${bounds.top}px`
		svgElement.style.width = `${bounds.width}px`
		svgElement.style.height = `${bounds.height}px`
		svgElement.setAttribute("width", String(bounds.width))
		svgElement.setAttribute("height", String(bounds.height))
		svgElement.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`)
		pathElement.setAttribute("d", safeZonePath)
	}

	return {
		svgElement,
		pathElement,
		update,
		destroy: () => {
			svgElement.remove()
		},
	}
}
