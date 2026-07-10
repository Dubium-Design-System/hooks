import { useEffect, useRef } from "react"

type EffectFn = () => void | VoidFunction

/**
 * Хук, имитирующий поведение componentDidMount.
 *
 * Выполняет переданную функцию один раз при монтировании компонента.
 * Защищён от двойного вызова в dev-режиме с React.StrictMode за счёт использования useRef.
 *
 * Если функция возвращает другую функцию, она будет вызвана при размонтировании компонента (аналог componentWillUnmount).
 *
 * @example
 * useMountEffect(() => {
 *   const id = setInterval(() => {
 *     console.log('tick');
 *   }, 1000);
 *
 *   return () => clearInterval(id); // Очистка ресурса
 * });
 *
 * @param fn - Функция, вызываемая при монтировании. Может вернуть функцию очистки.
 */
export const useMountEffect = (fn: EffectFn): void => {
	const fnRef = useRef(fn)

	useEffect(() => {
		fnRef.current = fn
	}, [fn])

	useEffect(() => {
		const cleanup = fnRef.current()

		return () => {
			cleanup?.()
		}
	}, [])
}
