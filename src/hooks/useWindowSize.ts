import { useMemo, useSyncExternalStore } from "react"

/**
 * Размеры окна браузера.
 */
export interface IWindowSize {
	/** Высота окна. */
	height: number
	/** Ширина окна. */
	width: number
}

/** Размеры окна по умолчанию для SSR. */
const SERVER_SIZE: IWindowSize = Object.freeze({ height: 0, width: 0 })
/** Сериализованные размеры для SSR. */
const SERVER_SNAPSHOT = JSON.stringify(SERVER_SIZE)

/**
 * Читает текущие размеры окна.
 *
 * @returns Текущие размеры окна.
 */
const readWindowSize = (): IWindowSize => {
	if (typeof window === "undefined") {
		return SERVER_SIZE
	}

	return {
		height: window.innerHeight,
		width: window.innerWidth,
	}
}

/**
 * Возвращает сериализованный снимок размеров окна.
 *
 * @returns JSON-строка размеров окна.
 */
const getSnapshot = (): string => {
	return JSON.stringify(readWindowSize())
}

/**
 * Подписывается на изменения размеров окна с троттлингом через requestAnimationFrame.
 *
 * @param onStoreChange - Колбэк при изменении размеров.
 * @returns Функция отписки.
 */
const subscribe = (onStoreChange: VoidFunction): VoidFunction => {
	if (typeof window === "undefined") {
		return () => undefined
	}

	let frameId: null | number = null

	/** Планирует обновление на следующий animation frame. */
	const scheduleUpdate = (): void => {
		if (frameId !== null) {
			return
		}

		frameId = window.requestAnimationFrame(() => {
			frameId = null
			onStoreChange()
		})
	}

	window.addEventListener("resize", scheduleUpdate)

	if (window.visualViewport) {
		window.visualViewport.addEventListener("resize", scheduleUpdate)
	}

	return () => {
		window.removeEventListener("resize", scheduleUpdate)

		if (window.visualViewport) {
			window.visualViewport.removeEventListener("resize", scheduleUpdate)
		}

		if (frameId !== null) {
			window.cancelAnimationFrame(frameId)
		}
	}
}

/**
 * Отслеживает размеры окна браузера.
 *
 * Использует `useSyncExternalStore` для реактивного отслеживания
 * размеров окна с троттлингом через requestAnimationFrame.
 * Поддерживает visualViewport для мобильных браузеров.
 *
 * @returns Текущие размеры окна.
 */
export const useWindowSize = (): IWindowSize => {
	const serializedSize = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)

	return useMemo(() => JSON.parse(serializedSize) as IWindowSize, [serializedSize])
}
