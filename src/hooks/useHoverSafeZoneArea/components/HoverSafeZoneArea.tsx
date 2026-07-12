import type { IHoverSafeZoneAreaProps } from "../useHoverSafeZoneArea.types"

import { useHoverSafeZoneArea } from "../hooks/useHoverSafeZoneArea"

/**
 * Компонент для создания безопасной зоны при наведении.
 *
 * Использует render-prop паттерн для передачи ref-ов на target и container элементы.
 * Невидимый SVG hit-test создаётся и удаляется внутри хука автоматически.
 *
 * @example
 * ```tsx
 * <HoverSafeZoneArea
 *   isActive={isOpen}
 *   onRequestClose={() => setIsOpen(false)}
 * >
 *   {({ targetRef, containerRef }) => (
 *     <>
 *       <button ref={targetRef}>Target</button>
 *       <div ref={containerRef}>Container</div>
 *     </>
 *   )}
 * </HoverSafeZoneArea>
 * ```
 */
export const HoverSafeZoneArea = ({ children, ...options }: IHoverSafeZoneAreaProps) => {
	const { targetRef, containerRef } = useHoverSafeZoneArea(options)

	return children({
		targetRef,
		containerRef,
	})
}
