# sigui

**sigui** is a data-oriented web framework.

## Install

```sh
npm i github:stagas/sigui
```

## Usage

```jsx
import { Sigui } from 'sigui'

// we declare component `Counter`.
export function Counter() {
  // we use `Sigui` as `$`
  using $ = Sigui()

  // `info` holds our reactive data.
  const info = $({ clicks: 0 })

  $.fx(() => {
    // when `clicks` changes, this function will be called.
    const { clicks } = info

    // we end our observation here.
    $()

    // => prints (in sync): `0`
    console.log(clicks)
  })

  // we return the component instance.
  return <div onclick={() => info.clicks++}>
    {() => info.clicks}
  </div>
}
```

Sometimes, when data aren't ready yet (they are `null` or `undefined`), we can use `$.of(info)` in our `$.fx` function while destructuring:

```ts
const info = $({ bar: null })

$.fx(() => {
  // execution halts here and will proceed when `bar` is populated with data.
  const { bar } = $.of(info)

  $()

  // nothing prints yet, as `bar` is still `null`.
  console.log(bar)
})

// => prints: 'bar'
foo.info.bar = 'bar'
```

## Creating JSX Components

Add these two lines to your `tsconfig.json` under `compilerOptions`:

```json
    "jsx": "react-jsx",
    "jsxImportSource": "sigui",
```

then create a component as following:

```ts
export function Foo() {
  return <div />
}
```

and use it as following:

```tsx
<Foo />
```

## Web Rendering + Hot Module Reloading (HMR)

#### `client.tsx` :

```tsx
import { cleanup, hmr, mount } from 'sigui'
import { App } from './App.tsx'
import { setState, state } from './state.ts'

export const start = mount('#container', target => {
  target.replaceChildren(<App />)
  return cleanup
})

if (import.meta.hot) {
  import.meta.hot.accept(hmr(start, state, setState))
}
else {
  start()
}
```
---

#### `state.ts` :

```ts
import { $ } from 'sigui'

export let state = $({ foo: 123 })

export function setState(newState: any) {
  state = newState
}
```

## License

MIT
