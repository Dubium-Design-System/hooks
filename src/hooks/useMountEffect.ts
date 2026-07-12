import { type EffectCallback, useEffect, useRef } from "react"

/**
 * Выполняет эффект только при монтировании компонента.
 *
 * Аналог `useEffect(fn, [])`, но с использованием ref для хранения
 * колбэка, что позволяет избежать предупреждений линтера
 * о пустом массиве зависимостей.
 *
 * @param effect - Эффект, который нужно выполнить при монтировании.
 */
export const useMountEffect = (effect: EffectCallback): void => {
	/** Ref для хранения актуального эффекта. */
	const initialEffectRef = useRef(effect)

	useEffect(() => {
		initialEffectRef.current()
	}, [])
}
