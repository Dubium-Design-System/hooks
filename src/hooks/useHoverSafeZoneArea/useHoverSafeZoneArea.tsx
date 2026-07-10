/**
 * Хук для создания безопасной зоны при наведении.
 *
 * Создаёт невидимую область между target- и container-элементами,
 * предотвращающую ложное закрытие всплывающих элементов.
 *
 * @example
 * ```tsx
 * const { targetRef, containerRef, elementToRender } = useHoverSafeZoneArea({
 *   isActive: isOpen,
 *   onRequestClose: () => setIsOpen(false),
 * });
 * ```
 */

export { useHoverSafeZoneArea } from "./hooks/useHoverSafeZoneArea"
