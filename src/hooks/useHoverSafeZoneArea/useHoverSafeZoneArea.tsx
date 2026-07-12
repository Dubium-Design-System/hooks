/**
 * Хук для создания безопасной зоны при наведении.
 *
 * Создаёт невидимую область между target- и container-элементами,
 * предотвращающую ложное закрытие всплывающих элементов.
 * SVG для hit-test создаётся и удаляется внутри хука автоматически.
 *
 * @example
 * ```tsx
 * const { targetRef, containerRef } = useHoverSafeZoneArea({
 *   isActive: isOpen,
 *   onRequestClose: () => setIsOpen(false),
 * });
 * ```
 */

export { useHoverSafeZoneArea } from "./hooks/useHoverSafeZoneArea"
