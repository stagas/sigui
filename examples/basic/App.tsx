import { Sigui } from '../..'
import { Counter } from './Counter.tsx'
import { state } from './state.ts'

export function App() {
  using $ = Sigui()

  // `info` holds our reactive data
  const info = $({
    greet: '',
    bg: 'transparent',
    shuffle: 0,
  })

  // simple effect to change greet based on the number of clicks
  $.fx(() => {
    const { clicks } = state
    $()
    if (!clicks) {
      info.greet = 'Click'
    }
    else if (clicks > 5) {
      info.greet = 'Clicking too many, eh...'
    }
    else if (clicks > 0) {
      info.greet = 'Hello, there!'
    }
  })

  $.fx(() => {
    const { clicks } = $.of(state)
    $()
    if (state.items.has(clicks)) return

    const entries = [...state.items]

    // insert element at a random position
    const el = <div onmousedown={() => state.clicked = clicks}>{clicks}</div>
    const insertPos = Math.round(Math.random() * entries.length)
    entries.splice(insertPos, 0, [clicks, { el }])

    // sometimes remove a random element
    if (Math.random() > .8) {
      const removePos = Math.round(Math.random() * entries.length)
      // don't remove the one we just inserted
      if (removePos !== insertPos) {
        entries.splice(removePos, 1)
      }
    }

    state.items = new Map(entries)
  })

  $.fx(() => {
    const { shuffle } = info
    $()
    const entries = [...state.items]
    entries.sort(() => Math.random() - .5)
    state.items = new Map(entries)
  })

  return <main
    style={() => /*css*/`
      background: ${info.bg};
      display: flex;
      flex-flow: column wrap;
      gap: 10px;
      padding: 10px;
    `}
    onmouseenter={() => info.bg = '#433'}
    onmouseleave={() => info.bg = 'transparent'}
  >
    <div style={/*css*/`
      display: flex;
      flex-flow: row nowrap;
      gap: 10px;
    `}>
      <button
        style={() => /*css*/`
          width: 100%;
          font-family: monospace;
          background: ${state.clicks != null && +state?.clicks > 5
            ? '#a50'
            : '#444'
          };
          color: #fff;
          padding: 10px;
        `}
        onclick={$.fn(() => {
          console.warn('clicked')
          state.clicks ??= 0
          state.clicks++
        })}
      >
        {() => info.greet}
      </button>

      <button
        style={() => /*css*/`
          font-family: monospace;
          background: #444;
          color: #fff;
          padding: 10px;
        `}
        onclick={$.fn(() => {
          console.warn('shuffle')
          info.shuffle++
        })}
      >
        shuffle
      </button>
    </div>

    {() => state.renders} list renders

    <Counter
      // we can access the Signal object of a prop under `.$.<prop>`
      clicks={state.$.clicks}
      greet={info.$.greet}
    />

    {() => state.clicked >= 0 ? `clicked ${state.clicked}` : ''}

    <div style={() => /*css*/`background: #834; padding: 10px;`}>
      {/* inline effect that returns an array of elements */}
      {() => {
        const { clicks } = $.of(state)
        const { shuffle } = info
        $()
        console.warn('render')
        state.renders++
        return state.items
      }}
    </div>
  </main >
}
