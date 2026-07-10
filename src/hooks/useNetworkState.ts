import { useEffect, useState } from "react"

type NetworkEffectiveType = "2g" | "3g" | "4g" | "slow-2g"

type NetworkConnectionType = "bluetooth" | "cellular" | "ethernet" | "none" | "other" | "unknown" | "wifi" | "wimax"

type NetworkInformationLite = {
	readonly downlink?: number
	readonly downlinkMax?: number
	readonly effectiveType?: NetworkEffectiveType
	readonly rtt?: number
	readonly saveData?: boolean
	readonly type?: NetworkConnectionType
} & EventTarget

type BrowserNavigatorLite = {
	readonly connection?: NetworkInformationLite
	readonly mozConnection?: NetworkInformationLite
	readonly onLine: boolean
	readonly webkitConnection?: NetworkInformationLite
}

/**
 * Состояние сетевого подключения.
 */
export interface NetworkState {
	/** Скорость загрузки в Мбит/с. */
	downlink: null | number

	/** Максимальная скорость загрузки в Мбит/с. */
	downlinkMax: null | number

	/** Тип эффективного соединения. */
	effectiveType: NetworkEffectiveType | null

	/** Флаг наличия интернет-соединения. */
	online: boolean

	/** Round-trip time в миллисекундах. */
	rtt: null | number

	/** Флаг режима экономии данных. */
	saveData: boolean | null

	/** Тип сетевого подключения. */
	type: NetworkConnectionType | null
}

/**
 * Возвращает браузерный объект navigator.
 *
 * @returns Объект navigator или null при SSR.
 */
const getBrowserNavigator = (): BrowserNavigatorLite | null => {
	if (typeof window === "undefined") {
		return null
	}

	return Reflect.get(window, "navigator")
}

/**
 * Возвращает информацию о сетевом соединении.
 *
 * @returns Информация о соединении или null, если API недоступен.
 */
const getConnection = (): NetworkInformationLite | null => {
	const browserNavigator = getBrowserNavigator()

	if (!browserNavigator) {
		return null
	}

	return browserNavigator.connection ?? browserNavigator.mozConnection ?? browserNavigator.webkitConnection ?? null
}

/**
 * Собирает текущее состояние сети.
 *
 * @returns Текущее состояние сетевого подключения.
 */
const getNetworkState = (): NetworkState => {
	const browserNavigator = getBrowserNavigator()
	const connection = getConnection()

	return {
		online: browserNavigator?.onLine ?? false,
		downlink: connection?.downlink ?? null,
		downlinkMax: connection?.downlinkMax ?? null,
		effectiveType: connection?.effectiveType ?? null,
		rtt: connection?.rtt ?? null,
		saveData: connection?.saveData ?? null,
		type: connection?.type ?? null,
	}
}

/**
 * Хук для отслеживания состояния сетевого подключения.
 *
 * Предоставляет информацию о статусе соединения, типе сети,
 * скорости загрузки, задержке и режиме экономии данных.
 *
 * @returns Текущее состояние сетевого подключения.
 *
 * @example
 * ```tsx
 * const { online, effectiveType, downlink } =
 *   useNetworkState()
 *
 * return (
 *   <div>
 *     {online ? "Online" : "Offline"} ({effectiveType})
 *   </div>
 * )
 * ```
 */
export const useNetworkState = (): NetworkState => {
	const [networkState, setNetworkState] = useState<NetworkState>(getNetworkState)

	useEffect(() => {
		const connection = getConnection()

		const updateNetworkState = (): void => {
			setNetworkState(getNetworkState())
		}

		window.addEventListener("online", updateNetworkState)

		window.addEventListener("offline", updateNetworkState)

		connection?.addEventListener("change", updateNetworkState)

		return () => {
			window.removeEventListener("online", updateNetworkState)

			window.removeEventListener("offline", updateNetworkState)

			connection?.removeEventListener("change", updateNetworkState)
		}
	}, [])

	return networkState
}
