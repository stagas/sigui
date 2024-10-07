import { createGroupElement, fns, hmr as jsxHmr, Off, Start } from 'jsx'
import $, { Signal, fx as signalfx } from 'signal'
import { isFunction, once } from 'utils'
import { updateChildren } from './dom.ts'

export { mount } from 'jsx'

type X = typeof $

type Component = Element | { el: Element }

export interface Sigui extends X {
  __proto__: typeof $
  fx: typeof signalfx
  dispose(): void
  disposables: Off[]
  [Symbol.dispose](): void
}

let jsxState: { disposables: Off[] } = { disposables: [] }

const capturing: any[][] = []
let currentCaptured: (() => void)[] = []

const stack: Sigui[] = []

function call(fn: () => any) { fn() }

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
      sigui.disposables.forEach(call)
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

fns.mapItemFn = (item) => {
  if (typeof item !== 'function') return item
  let parent: ((HTMLElement | SVGElement) & { _captured?: any[] }) | null
  let child: (Text | Element) & { _captured?: any[] } = new Text()
  let captured: any[]
  const fn = item
  queueMicrotask(() => {
    fx(function render() {
      capturing.push([])
      currentCaptured = captured

      let result:
        | null
        | undefined
        | string
        | boolean
        | Component
        | Map<any, Component>
        | Set<Component>
        | Array<Component> = fn(captured)

      captured = capturing.pop()!

      if (result instanceof Signal) {
        result = result.valueOf()
      }

      if (result instanceof Map || result instanceof Set) {
        result = [...result.values()]
      }

      if (Array.isArray(result)) {
        if (!parent) parent = child.parentElement ?? createGroupElement()
        const next = result.map((item) => 'el' in item ? item.el : item)
        const prev = Array.from(parent.children)
        updateChildren(
          parent,
          prev,
          next
        )
        return
      }
      else if (result !== null && typeof result === 'object') {
        const next = 'el' in result ? result.el : result
        child.replaceWith(child = next)
      }
      else {
        child.textContent = typeof result === 'boolean'
          ? ''
          : (result ?? '')
      }
    })
  })
  return child
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

export const fx: typeof signalfx = function fx(fn: any, thisArg: any, desc?: any): any {
  if (!isFunction(fn)) return signalfx(fn, thisArg, desc)
  const dispose = once(signalfx(fn, thisArg))
  disposable(dispose)
  return dispose
}

export function disposable(fn: Off) {
  capturing.at(-1)?.push(fn)
  jsxState.disposables.push(fn)
}

export function dispose(): true {
  currentCaptured?.forEach(call)
  return true
}

export function cleanup() {
  jsxState.disposables.splice(0).forEach(call)
}

export function hmr<T extends Record<string, any>>(start: Start, state: T, setState: (x: T) => void) {
  if (!import.meta.hot) return () => { }
  return jsxHmr(start, Object.assign(state, { disposables: [] }), function (newState) {
    Object.assign(newState, { disposables: [] })
    jsxState = newState as any
    setState(newState)
  })
}
