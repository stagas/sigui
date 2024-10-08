import { cleanup, hmr, mount } from '../..'
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
