import { useEffect, useRef, useState } from "react"

/**
 * Хук для отслеживания состояния наведения (hover) на DOM-элемент.
 *
 * Возвращает ref, который нужно прикрепить к элементу, и булево значение,
 * указывающее, находится ли курсор мыши над элементом.
 *
 * @template T - Тип HTML-элемента (по умолчанию HTMLElement).
 * @returns Кортеж [ref, hovered], где ref — callback ref для элемента,
 *          а hovered — `true`, если курсор находится над элементом.
 *
 * @example
 * ```tsx
 * const [ref, isHovered] = useHover<HTMLDivElement>();
 *
 * return <div ref={ref}>{isHovered ? "Наведён" : "Не наведён"}</div>;
 * ```
 */
export const useHover = <T extends HTMLElement = HTMLElement>() => {
	const ref = useRef<null | T>(null)
	const [hovered, setHovered] = useState(false)

	useEffect(() => {
		const element = ref.current

		const handleMouseEnter = (): void => {
			setHovered(true)
		}

		const handleMouseLeave = (): void => {
			setHovered(false)
		}

		element?.addEventListener("mouseenter", handleMouseEnter)
		element?.addEventListener("mouseleave", handleMouseLeave)

		return () => {
			element?.removeEventListener("mouseenter", handleMouseEnter)
			element?.removeEventListener("mouseleave", handleMouseLeave)
		}
	}, [])

	return [ref, hovered] as const
}
