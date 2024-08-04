import { fns, hmr as jsxHmr, Off, Start } from 'jsx'
import $, { fx as signalfx } from 'signal'
import { isFunction, once } from 'utils'

export { mount } from 'jsx'

let jsxState: { disposables: Off[] } = { disposables: [] }

type X = typeof $

export interface Fx extends X {
  fx: typeof signalfx
  dispose(): void
  disposables: Off[]
  [Symbol.dispose](): void
}

const stack: Fx[] = []

export function Fx() {
  const _fx: Fx = Object.assign(function (state?: any, props?: any): any {
    return $(state, props)
  } as any, {
    fx(fn: any, thisArg: any, desc?: any): any {
      if (!isFunction(fn)) return signalfx(fn, thisArg, desc)
      const dispose = fx(fn, thisArg)
      _fx.disposables.push(dispose)
      return dispose
    },
    dispose: once(function dispose() {
      _fx.disposables.forEach(fn => fn())
    }),
    disposables: [],
    [Symbol.dispose](this: Fx) {
      if (stack.pop() !== this) {
        throw new Error('Fx out-of-order.')
      }
    }
  })
  // @ts-ignore
  _fx.__proto__ = $
  const last = stack.at(-1)
  last?.disposables.push(_fx.dispose)
  stack.push(_fx)
  return _fx
}

export const fx: typeof signalfx = function fx(fn: any, thisArg: any, desc?: any): any {
  if (!isFunction(fn)) return signalfx(fn, thisArg, desc)
  const dispose = once(signalfx(fn, thisArg))
  disposable(dispose)
  return dispose
}

export function cleanup() {
  jsxState.disposables.splice(0).forEach(fn => fn())
}

export function hmr<T extends Record<string, any>>(start: Start, state: T, replaceState: (x: T) => void) {
  if (!import.meta.hot) return () => { }
  return jsxHmr(start, Object.assign(state, { disposables: [] }), function (newState) {
    Object.assign(newState, { disposables: [] })
    jsxState = newState as any
    replaceState(newState)
  })
}

fns.computedAttributeFn = (el, name, fn) => {
  fx(() => {
    if (name === 'style') {
      Object.assign(el.style, fn())
    }
    else {
      el.setAttribute(
        name,
        [fn()].flat(Infinity).filter(Boolean).join(' ')
      )
    }
  })
}

fns.mapItemFn = (item) => {
  if (typeof item !== 'function') return item
  const child = new Text()
  const fn = item
  fx(() => {
    const result = fn()
    child.textContent = result
  })
  return child
}

export function disposable(fn: Off) {
  jsxState.disposables.push(fn)
}

if (import.meta.vitest) {
  describe('Fx', () => {
    it('simple top level', () => {
      let enter = 0
      let leave = 0
      {
        using _ = Fx()
        _.fx(() => {
          enter++
          return () => {
            leave++
          }
        })
      }
      cleanup()
      expect(enter).toBe(1)
      expect(leave).toBe(1)
    })

    it('with child', () => {
      let enter: string[] = []
      let leave: string[] = []

      function Child() {
        using _ = Fx()
        _.fx(() => {
          enter.push('b')
          return () => {
            leave.push('b')
          }
        })
      }

      {
        using _ = Fx()
        const child = Child()
        _.fx(() => {
          enter.push('a')
          return () => {
            leave.push('a')
          }
        })
      }

      cleanup()

      expect(enter).toEqual(['b', 'a'])
      expect(leave).toEqual(['b', 'a'])
    })

    it('with child, dispose parent manually', () => {
      let enter: string[] = []
      let leave: string[] = []

      function Child() {
        using _ = Fx()
        _.fx(() => {
          enter.push('b')
          return () => {
            leave.push('b')
          }
        })
      }

      function Parent() {
        using _ = Fx()
        const child = Child()
        _.fx(() => {
          enter.push('a')
          return () => {
            leave.push('a')
          }
        })
        return _
      }

      const p = Parent()

      expect(enter).toEqual(['b', 'a'])
      expect(leave).toEqual([])

      p.dispose()

      expect(enter).toEqual(['b', 'a'])
      expect(leave).toEqual(['b', 'a'])

      // should have no effect
      cleanup()
      expect(enter).toEqual(['b', 'a'])
      expect(leave).toEqual(['b', 'a'])
    })

    it('with child, dispose child manually', () => {
      let enter: string[] = []
      let leave: string[] = []

      function Child(x: string) {
        using _ = Fx()
        _.fx(() => {
          enter.push(x)
          return () => {
            leave.push(x)
          }
        })
        return _
      }

      {
        using _ = Fx()
        const b = Child('b')
        const c = Child('c')
        _.fx(() => {
          enter.push('a')
          return () => {
            leave.push('a')
          }
        })
        b.dispose()
      }

      cleanup()

      expect(enter).toEqual(['b', 'c', 'a'])
      expect(leave).toEqual(['b', 'c', 'a'])
    })

    it('late fx disposes', async () => {
      let enter = 0
      let leave = 0
      {
        using _ = Fx()
        setTimeout(() => {
          _.fx(() => {
            enter++
            return () => {
              leave++
            }
          })
        }, 10)
      }
      await new Promise(resolve => setTimeout(resolve, 20))
      cleanup()
      expect(enter).toBe(1)
      expect(leave).toBe(1)
    })

  }) // end describe
}
