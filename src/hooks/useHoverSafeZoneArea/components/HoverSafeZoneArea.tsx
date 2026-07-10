import type { HoverSafeZoneAreaProps } from "../useHoverSafeZoneArea.types"

import { useHoverSafeZoneArea } from "../hooks/useHoverSafeZoneArea"

/**
 * Компонент для создания безопасной зоны при наведении.
 *
 * Использует render-prop паттерн для передачи ref-ов на target и container элементы.
 * Автоматически рендерит оверлей safe-zone при активации.
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
export const HoverSafeZoneArea = ({ children, ...options }: HoverSafeZoneAreaProps) => {
	const safeZoneArea = useHoverSafeZoneArea(options)

	return (
		<>
			{children({
				targetRef: safeZoneArea.targetRef,
				containerRef: safeZoneArea.containerRef,
			})}

			{safeZoneArea.elementToRender}
		</>
	)
}
