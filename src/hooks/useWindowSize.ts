import { useEffect, useState } from "react"

/**
 * Размеры окна браузера.
 */
interface WindowSize {
	/** Высота окна в пикселях. */
	height: number
	/** Ширина окна в пикселях. */
	width: number
}

/**
 * Возвращает текущие размеры окна браузера.
 * При SSR возвращает нулевые значения.
 *
 * @returns Объект с шириной и высотой окна.
 */
const getWindowSize = (): WindowSize => {
	if (typeof window === "undefined") {
		return {
			width: 0,
			height: 0,
		}
	}

	return {
		width: window.innerWidth,
		height: window.innerHeight,
	}
}

/**
 * Хук для отслеживания размеров окна браузера.
 *
 * Автоматически обновляется при изменении размеров окна (resize).
 * При SSR возвращает `{ width: 0, height: 0 }`.
 *
 * @returns Текущие ширина и высота окна.
 *
 * @example
 * ```tsx
 * const { width, height } = useWindowSize();
 *
 * return <div>Ширина: {width}px, Высота: {height}px</div>;
 * ```
 */
export const useWindowSize = (): WindowSize => {
	const [windowSize, setWindowSize] = useState<WindowSize>(() => {
		return getWindowSize()
	})

	useEffect(() => {
		const handleResize = () => {
			setWindowSize(getWindowSize())
		}

		window.addEventListener("resize", handleResize)

		return () => {
			window.removeEventListener("resize", handleResize)
		}
	}, [])

	return windowSize
}
