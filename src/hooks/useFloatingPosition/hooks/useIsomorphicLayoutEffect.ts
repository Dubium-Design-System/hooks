import { useEffect, useLayoutEffect } from "react"

/**
 * Изоморфный layout-effect для SSR и браузера.
 */
export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect
