# fx

**fx** is a powerful, elegant, data-oriented state management system.

```ts
import { Fx } from 'stagas/fx'

// we declare component `Foo`.
function Foo() {
  // we use `Fx` as `_`
  using _ = Fx()

  // `info` holds our reactive data.
  const info = _({ bar: 'bar' })

  _.fx(() => {
    // when `bar` changes, this function will be called.
    const { bar } = info

    // we end our observation here.
    _()

    // => prints (in sync): `bar`
    console.log(bar)
  })

  // we return the component instance.
  return { info }
}

// we create an instance of `Foo`.
const foo = Foo()

// => prints: `baz`
foo.info.bar = 'baz'

// `foo` will be disposed automagically by the higher order system(s) we use,
// but if we prefer to do it manually now, we call:
foo.dispose()
```

# License

MIT
