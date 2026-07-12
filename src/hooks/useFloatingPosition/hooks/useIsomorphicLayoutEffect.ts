import { useEffect, useLayoutEffect } from "react"

/**
 * Изоморфный layout-effect для SSR и браузера.
 *
 * В браузере использует `useLayoutEffect` для синхронного применения эффектов,
 * на сервере — `useEffect` для избежания ошибок при SSR.
 */
export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect
