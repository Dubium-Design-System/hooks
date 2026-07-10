# @dubium/hooks

Лёгкая и кастомизируемая библиотека React хуков для удобной и эффективной разработки современных веб-приложений.

---

## Установка

```bash
npm install @dubium/hooks
# или
yarn add @dubium/hooks
```

---

## Описание

Пакет содержит набор хорошо продуманных React хуков, которые помогают оптимизировать разработку, улучшить читаемость кода и повысить производительность приложения.

---

## Доступные хуки

- `useCombinedRefs` — объединяет несколько рефов в один.
- `useDebounce` — хук для дебаунса значения или функции.
- `useHover` - хук для отслеживания наведения курсора на элемент.

---

## Пример использования

```tsx
import React, { useRef } from "react"
import { useCombinedRefs, useDebounce } from "@dubium/hooks"

function Example() {
	const ref1 = useRef(null)
	const ref2 = useRef(null)
	const combinedRef = useCombinedRefs(ref1, ref2)

	const [value, setValue] = React.useState("")
	const debouncedValue = useDebounce(value, 300)

	React.useEffect(() => {
		console.log("Debounced value:", debouncedValue)
	}, [debouncedValue])

	return (
		<input ref={combinedRef} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type here..." />
	)
}
```

## Лицензия

MIT © [DubiumEkb](https://github.com/DubiumEkb)

---

## Контакты и поддержка

Если у вас есть вопросы или предложения — создавайте issue на [GitHub](https://github.com/DubiumEkb/dubium-design/issues).

---

Спасибо за использование `@dubium/hooks`!
