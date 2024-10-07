/** @jsxImportSource ../src */
import { ticks } from 'utils'
import { cleanup, Sigui } from '../src/sigui.ts'

describe('Sigui', () => {
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

  it.skip('removing child disposes', async () => {
    let enter: string[] = []
    let leave: string[] = []

    function Div({ name, children }: { name: string, children?: any }) {
      using $ = Sigui()
      $.fx(() => {
        enter.push(name)
        return () => {
          leave.push(name)
        }
      })
      return <div>{children}</div>
    }

    {
      using $ = Sigui()
      const info = $({ name: 'b' })
      const div = <Div name="a">
        {() => <Div name={info.name}></Div>}
      </Div>
      await ticks(1)
      info.name = 'c'
    }

    expect(enter).toEqual(['a', 'b', 'c'])
    expect(leave).toEqual(['b'])
    cleanup()
    expect(leave).toEqual(['b', 'c', 'a'])
  })
})
