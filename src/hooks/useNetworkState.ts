import { useMemo, useSyncExternalStore } from "react"

/**
 * Тип эффективности сетевого соединения.
 */
export type TNetworkEffectiveType = "2g" | "3g" | "4g" | "slow-2g"

/**
 * Тип сетевого соединения.
 */
export type TNetworkConnectionType =
	"bluetooth" | "cellular" | "ethernet" | "mixed" | "none" | "other" | "unknown" | "wifi" | "wimax"

/** Интерфейс, описывающий NetworkInformation API. */
interface INetworkInformationLike extends EventTarget {
	downlink?: number
	effectiveType?: TNetworkEffectiveType
	rtt?: number
	saveData?: boolean
	type?: TNetworkConnectionType
}

/** Navigator с возможным connection API. */
type TNavigatorWithConnection = {
	connection?: INetworkInformationLike
	mozConnection?: INetworkInformationLike
	webkitConnection?: INetworkInformationLike
}

/**
 * Состояние сети.
 */
export interface INetworkState {
	/** Скорость загрузки в Мбит/с. */
	downlink?: number
	/** Эффективный тип соединения. */
	effectiveType?: TNetworkEffectiveType
	/** Флаг наличия интернет-соединения. */
	online: boolean
	/** Round-trip time в миллисекундах. */
	rtt?: number
	/** Флаг режима экономии данных. */
	saveData?: boolean
	/** Тип сетевого соединения. */
	type?: TNetworkConnectionType
}

/** Состояние сети по умолчанию для SSR. */
const SERVER_STATE: INetworkState = Object.freeze({ online: true })
/** Сериализованное состояние для SSR. */
const SERVER_SNAPSHOT = JSON.stringify(SERVER_STATE)

/**
 * Возвращает объект NetworkInformation из navigator, если доступен.
 *
 * @returns NetworkInformation или null.
 */
const getConnection = (): INetworkInformationLike | null => {
	if (typeof window === "undefined") {
		return null
	}

	const currentNavigator = window as unknown as TNavigatorWithConnection

	return currentNavigator.connection ?? currentNavigator.mozConnection ?? currentNavigator.webkitConnection ?? null
}

/**
 * Читает текущее состояние сети.
 *
 * @returns Текущее состояние сети.
 */
const readNetworkState = (): INetworkState => {
	if (typeof window === "undefined") {
		return SERVER_STATE
	}

	const connection = getConnection()
	const currentNavigator = window as unknown as { onLine: boolean }

	return {
		downlink: connection?.downlink,
		effectiveType: connection?.effectiveType,
		online: currentNavigator.onLine,
		rtt: connection?.rtt,
		saveData: connection?.saveData,
		type: connection?.type,
	}
}

/**
 * Возвращает сериализованный снимок состояния сети.
 *
 * @returns JSON-строка состояния сети.
 */
const getSnapshot = (): string => {
	return JSON.stringify(readNetworkState())
}

/**
 * Подписывается на изменения состояния сети.
 *
 * @param onStoreChange - Колбэк при изменении состояния.
 * @returns Функция отписки.
 */
const subscribe = (onStoreChange: VoidFunction): VoidFunction => {
	if (typeof window === "undefined") {
		return () => undefined
	}

	const connection = getConnection()

	window.addEventListener("online", onStoreChange)
	window.addEventListener("offline", onStoreChange)

	if (connection) {
		connection.addEventListener("change", onStoreChange)
	}

	return () => {
		window.removeEventListener("online", onStoreChange)
		window.removeEventListener("offline", onStoreChange)

		if (connection) {
			connection.removeEventListener("change", onStoreChange)
		}
	}
}

/**
 * Отслеживает состояние сети браузера.
 *
 * Использует `useSyncExternalStore` для реактивного отслеживания
 * online/offline статуса, типа соединения, эффективного типа,
 * скорости загрузки и других параметров NetworkInformation API.
 *
 * @returns Текущее состояние сети.
 */
export const useNetworkState = (): INetworkState => {
	const serializedState = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)

	return useMemo(() => JSON.parse(serializedState) as INetworkState, [serializedState])
}
