import type { IFloatingAvailableSpace, IFloatingViewportRect } from "../useFloatingPosition.types"

/**
 * Параметры для расчёта доступного пространства вокруг reference-элемента.
 */
interface IGetAvailableSpaceParams {
	/** Минимальный отступ от границ viewport. */
	padding: number
	/** Прямоугольник reference-элемента. */
	referenceRect: DOMRect
	/** Прямоугольник viewport. */
	viewportRect: IFloatingViewportRect
}

/**
 * Считает доступное пространство вокруг reference-элемента.
 *
 * @param params - Параметры расчёта доступного пространства.
 * @returns Количество доступных пикселей сверху, справа, снизу и слева.
 */
export const getAvailableSpace = ({
	padding,
	referenceRect,
	viewportRect,
}: IGetAvailableSpaceParams): IFloatingAvailableSpace => ({
	bottom: Math.max(0, viewportRect.bottom - referenceRect.bottom - padding),
	left: Math.max(0, referenceRect.left - viewportRect.left - padding),
	right: Math.max(0, viewportRect.right - referenceRect.right - padding),
	top: Math.max(0, referenceRect.top - viewportRect.top - padding),
})
