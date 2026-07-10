import { useMemo } from "react"

import type { HoverSafeZonePointerType, UseHoverSafeZoneAreaOptions } from "../useHoverSafeZoneArea.types"

import {
	HOVER_SAFE_ZONE_DEFAULT_PADDING,
	HOVER_SAFE_ZONE_DEFAULT_POINTER_TYPES,
	HOVER_SAFE_ZONE_DEFAULT_TIMEOUT,
} from "../useHoverSafeZoneArea.constants"

/**
 * Нормализованные опции для хука useHoverSafeZoneArea.
 */
export interface ResolvedHoverSafeZoneAreaOptions {
	/** Флаг активности логики безопасной зоны. */
	isActive: boolean
	/** Флаг отключения всех взаимодействий. */
	isDisabled: boolean
	/** Колбэк при запросе закрытия. */
	onRequestClose?: VoidFunction
	/** Колбэк при входе указателя в safe-zone. */
	onSafeZoneEnter?: VoidFunction
	/** Колбэк при движении указателя внутри safe-zone. */
	onSafeZoneMove?: VoidFunction
	/** Колбэк при закрытии по таймауту. */
	onTimeout?: VoidFunction
	/** Отступ вокруг target/container. */
	padding: number
	/** Типы указателя, для которых работает safe-zone. */
	pointerTypes: readonly HoverSafeZonePointerType[]
	/** Время до авто-закрытия safe-zone (мс). */
	timeout: number
}

/**
 * Нормализует положительное число: проверяет конечность и неотрицательность.
 *
 * @param value - Исходное значение.
 * @param fallback - Значение по умолчанию, если исходное невалидно.
 * @returns Нормализованное положительное число.
 */
const normalizePositiveNumber = (value: number, fallback: number): number => {
	if (!Number.isFinite(value)) {
		return fallback
	}

	return Math.max(0, value)
}

/**
 * Нормализует типы указателей: возвращает значение по умолчанию, если массив пуст.
 *
 * @param pointerTypes - Исходный массив типов указателей.
 * @returns Массив типов указателей.
 */
const normalizePointerTypes = (
	pointerTypes: UseHoverSafeZoneAreaOptions["pointerTypes"],
): readonly HoverSafeZonePointerType[] => {
	if (!pointerTypes?.length) {
		return HOVER_SAFE_ZONE_DEFAULT_POINTER_TYPES
	}

	return pointerTypes
}

/**
 * Хук для нормализации и мемоизации опций useHoverSafeZoneArea.
 *
 * Приводит значения padding, timeout и pointerTypes к безопасным значениям
 * по умолчанию, если они невалидны.
 *
 * @param options - Исходные опции.
 * @returns Нормализованные опции.
 */
export const useResolvedHoverSafeZoneAreaOptions = ({
	isActive,
	isDisabled = false,
	timeout = HOVER_SAFE_ZONE_DEFAULT_TIMEOUT,
	padding = HOVER_SAFE_ZONE_DEFAULT_PADDING,
	pointerTypes,
	onSafeZoneEnter,
	onSafeZoneMove,
	onRequestClose,
	onTimeout,
}: UseHoverSafeZoneAreaOptions): ResolvedHoverSafeZoneAreaOptions => {
	const safePadding = normalizePositiveNumber(padding, HOVER_SAFE_ZONE_DEFAULT_PADDING)
	const safeTimeout = normalizePositiveNumber(timeout, HOVER_SAFE_ZONE_DEFAULT_TIMEOUT)
	const safePointerTypes = normalizePointerTypes(pointerTypes)

	return useMemo(
		() => ({
			isActive,
			isDisabled,
			timeout: safeTimeout,
			padding: safePadding,
			pointerTypes: safePointerTypes,
			onSafeZoneEnter,
			onSafeZoneMove,
			onRequestClose,
			onTimeout,
		}),
		[
			isActive,
			isDisabled,
			onRequestClose,
			onSafeZoneEnter,
			onSafeZoneMove,
			onTimeout,
			safePadding,
			safePointerTypes,
			safeTimeout,
		],
	)
}
