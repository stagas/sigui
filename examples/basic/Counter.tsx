import { Signal } from '../..'

export function Counter(props: {
  clicks: Signal<number | null>,
  greet: Signal<string>
}) {
  return <span style="color:orange"> {() =>
    +props.clicks || 'no'} clicks!</span>

}
