import { type PointerEvent as ReactPointerEvent, type RefObject, useId } from "react"

import type { HoverSafeZoneOverlayState } from "../useHoverSafeZoneArea.types"

import { HOVER_SAFE_ZONE_DATA_ATTRIBUTE, HOVER_SAFE_ZONE_Z_INDEX } from "../useHoverSafeZoneArea.constants"
import { Portal } from "./Portal"

/**
 * Свойства компонента HoverSafeZoneAreaOverlay.
 */
interface HoverSafeZoneAreaOverlayProps {
	/** Обработчик входа указателя в safe-zone path. */
	onSafeZonePointerEnter: (event: ReactPointerEvent<SVGPathElement>) => void
	/** Обработчик выхода указателя из safe-zone path. */
	onSafeZonePointerLeave: (event: ReactPointerEvent<SVGPathElement>) => void
	/** Обработчик движения указателя внутри safe-zone path. */
	onSafeZonePointerMove: (event: ReactPointerEvent<SVGPathElement>) => void
	/** Состояние оверлея safe-zone или null, если зона не активна. */
	overlayState: HoverSafeZoneOverlayState | null
	/** Ref на SVG-path элемент. */
	pathRef: RefObject<null | SVGPathElement>
	/** Ref на SVG-элемент. */
	svgRef: RefObject<null | SVGSVGElement>
}

export const HoverSafeZoneAreaOverlay = ({
	overlayState,
	svgRef,
	pathRef,
	onSafeZonePointerEnter: handleSafeZonePointerEnter,
	onSafeZonePointerMove: handleSafeZonePointerMove,
	onSafeZonePointerLeave: handleSafeZonePointerLeave,
}: HoverSafeZoneAreaOverlayProps) => {
	const reactId = useId()
	const clipPathId = `hover-safe-zone-${reactId.replace(/:/gu, "")}`

	if (!overlayState || typeof document === "undefined") {
		return null
	}

	const { bounds, safeZonePath, clipPath } = overlayState

	return (
		<Portal>
			<div
				{...{ [HOVER_SAFE_ZONE_DATA_ATTRIBUTE]: "" }}
				style={{
					position: "fixed",
					inset: 0,
					width: "100vw",
					height: "100vh",
					pointerEvents: "none",
					zIndex: HOVER_SAFE_ZONE_Z_INDEX,
					border: 0,
					boxShadow: "none",
				}}
			>
				<svg
					aria-hidden="true"
					height={bounds.height}
					ref={svgRef}
					style={{
						position: "fixed",
						top: bounds.top,
						left: bounds.left,
						display: "block",
						overflow: "hidden",
						pointerEvents: "none",
						border: 0,
						boxShadow: "none",
					}}
					viewBox={`0 0 ${bounds.width} ${bounds.height}`}
					width={bounds.width}
				>
					<defs>
						<clipPath clipPathUnits="userSpaceOnUse" id={clipPathId}>
							<path clipRule="evenodd" d={clipPath} fillRule="evenodd" />
						</clipPath>
					</defs>

					<path
						clipPath={`url(#${clipPathId})`}
						d={safeZonePath}
						fill="transparent"
						onPointerEnter={handleSafeZonePointerEnter}
						onPointerLeave={handleSafeZonePointerLeave}
						onPointerMove={handleSafeZonePointerMove}
						pointerEvents="none"
						ref={pathRef}
						stroke="transparent"
						strokeWidth={0}
					/>
				</svg>
			</div>
		</Portal>
	)
}

HoverSafeZoneAreaOverlay.displayName = "HoverSafeZoneAreaOverlay"
