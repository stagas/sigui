import { $ } from '../..'

export let state = $({
  renders: 0,
  clicks: null as null | number,
  clicked: -1,
  items: new Map<number, { el: Element }>()
})

export function setState(newState: any) {
  state = newState
}
