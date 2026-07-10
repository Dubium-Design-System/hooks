import { type ReactNode, useMemo } from "react"
import { createPortal } from "react-dom"

export interface IPortalProps {
	/**
	 * Дочерние элементы, которые будут отрендерены в портале.
	 */
	children: ReactNode

	/**
	 * Контейнер DOM-элемент, в который будет вставлен портал.
	 * По умолчанию — `document.body`.
	 */
	container?: HTMLElement
}

/**
 * Компонент Portal создает React-портал, позволяя
 * рендерить дочерние элементы вне текущей иерархии DOM.
 *
 * Используется, например, для модальных окон, тултипов,
 * уведомлений и прочих элементов, которые должны быть
 * расположены вне основного DOM-дерева приложения.
 *
 * @remarks
 * При серверном рендеринге (SSR) портал не создается,
 * чтобы избежать ошибок, связанных с отсутствием объекта `document`.
 *
 * @param props.children - Дочерние React-элементы для рендеринга в портале.
 * @param props.container - DOM-элемент контейнера, куда вставляется портал.
 *
 * @returns Портал с указанными дочерними элементами либо `null` при SSR.
 *
 * @example
 * ```tsx
 * <Portal>
 *   <Modal>Содержимое модального окна</Modal>
 * </Portal>
 * ```
 *
 * @example
 * ```tsx
 * // Рендеринг в кастомный контейнер
 * const modalRoot = document.getElementById('modal-root')
 *
 * <Portal container={modalRoot}>
 *   <Modal>Другой контейнер</Modal>
 * </Portal>
 * ```
 */
export const Portal = ({ children, container }: IPortalProps) => {
	const mountNode = useMemo(() => {
		if (typeof document === "undefined") return null
		return container ?? document.body
	}, [container])

	if (!mountNode) return null

	return createPortal(children, mountNode)
}

Portal.displayName = "Portal"
