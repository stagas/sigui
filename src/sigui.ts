import { createGroupElement, fns, hmr as jsxHmr, Off, Start } from 'jsx'
import $, { Signal, fx as signalfx } from 'signal'
import { isFunction, once } from 'utils'
import { updateChildren } from './dom.ts'

export { mount } from 'jsx'

let jsxState: { disposables: Off[] } = { disposables: [] }

type X = typeof $

export interface Sigui extends X {
  __proto__: typeof $
  fx: typeof signalfx
  dispose(): void
  disposables: Off[]
  [Symbol.dispose](): void
}

const stack: Sigui[] = []

export function Sigui() {
  const sigui: Sigui = Object.assign(function (state?: any, props?: any): any {
    return $(state, props)
  } as any, {
    fx(fn: any, thisArg: any, desc?: any): any {
      if (!isFunction(fn)) return signalfx(fn, thisArg, desc)
      const dispose = fx(fn, thisArg)
      sigui.disposables.push(dispose)
      return dispose
    },
    dispose: once(function dispose() {
      sigui.disposables.forEach(fn => fn())
    }),
    disposables: [],
    [Symbol.dispose](this: Sigui) {
      if (stack.pop() !== this) {
        throw new Error('Effect out-of-order.')
      }
    }
  })
  sigui.__proto__ = $
  const last = stack.at(-1)
  last?.disposables.push(sigui.dispose)
  stack.push(sigui)
  return sigui
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

export function hmr<T extends Record<string, any>>(start: Start, state: T, setState: (x: T) => void) {
  if (!import.meta.hot) return () => { }
  return jsxHmr(start, Object.assign(state, { disposables: [] }), function (newState) {
    Object.assign(newState, { disposables: [] })
    jsxState = newState as any
    setState(newState)
  })
}

fns.computedAttributeFn = (el, name, fn) => {
  fx(() => {
    if (name === 'style') {
      const result = fn()
      if (typeof result === 'string') {
        el.setAttribute('style', result)
      }
      else {
        Object.assign(el.style, result)
      }
    }
    else {
      el.setAttribute(
        name,
        [fn()]
          .flat(Infinity)
          .filter(Boolean)
          .join(' ')
      )
    }
  })
}

type Component = Element | { el: Element }

fns.mapItemFn = (item) => {
  if (typeof item !== 'function') return item
  let parent: HTMLElement | SVGElement | null
  let child: Text | Element = new Text()
  const fn = item
  queueMicrotask(() => {
    fx(function render() {
      let result:
        | null
        | undefined
        | string
        | Component
        | Map<any, Component>
        | Set<Component>
        | Array<Component> = fn()

      if (result instanceof Signal) {
        result = result.valueOf()
      }

      if (result instanceof Map || result instanceof Set) {
        result = [...result.values()]
      }

      if (Array.isArray(result)) {
        if (!parent) parent = child.parentElement ?? createGroupElement()
        updateChildren(
          parent,
          result.map((item) => 'el' in item ? item.el : item)
        )
        return
      }
      else if (result !== null && typeof result === 'object') {
        child.replaceWith(child = 'el' in result ? result.el : result)
      }
      else {
        child.textContent = result ?? ''
      }
    })
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
        using $ = Sigui()
        $.fx(() => {
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
        using $ = Sigui()
        $.fx(() => {
          enter.push('b')
          return () => {
            leave.push('b')
          }
        })
      }

      {
        using $ = Sigui()
        const child = Child()
        $.fx(() => {
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
        using $ = Sigui()
        $.fx(() => {
          enter.push('b')
          return () => {
            leave.push('b')
          }
        })
      }

      function Parent() {
        using $ = Sigui()
        const child = Child()
        $.fx(() => {
          enter.push('a')
          return () => {
            leave.push('a')
          }
        })
        return $
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
        using $ = Sigui()
        $.fx(() => {
          enter.push(x)
          return () => {
            leave.push(x)
          }
        })
        return $
      }

      {
        using $ = Sigui()
        const b = Child('b')
        const c = Child('c')
        $.fx(() => {
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
        using $ = Sigui()
        setTimeout(() => {
          $.fx(() => {
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
