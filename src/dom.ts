const ELEMENT_ID = 'sigui-id'

let nextElementId = 1

function ensureElementId(el: Element): string {
  if (!el.hasAttribute(ELEMENT_ID)) {
    const id = (nextElementId++).toString()
    el.setAttribute(ELEMENT_ID, id)
    return id
  }
  return el.getAttribute(ELEMENT_ID)!
}

export function updateChildren(parent: Element, prev: Element[], next: Element[]): void {
  const map = new Map(next.map((el, index) =>
    [ensureElementId(el), { el, index }] as const
  ))

  let lastIndex = 0
  const toRemove: Element[] = []

  // update existing elements and mark for removal
  prev.forEach((child) => {
    const childId = ensureElementId(child)
    const match = map.get(childId)
    if (match) {
      if (match.index < lastIndex) {
        // element needs to move backwards
        parent.insertBefore(child, parent.children[match.index])
      }
      else {
        // element stays in place or moves forward
        lastIndex = match.index
      }
      map.delete(childId)
    }
    else {
      toRemove.push(child)
    }
  })

  // remove unnecessary elements
  toRemove.forEach(el => parent.removeChild(el))

  // add new elements
  next.forEach((el, index) => {
    const id = ensureElementId(el)
    if (map.has(id)) {
      parent.insertBefore(el, parent.children[index] || null)
    }
  })
}
