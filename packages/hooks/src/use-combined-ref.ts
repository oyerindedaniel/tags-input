"use client"

import * as React from "react"

function useCombinedRefs<T>(...refs: React.Ref<T>[]): React.RefCallback<T> {
  return React.useMemo(
    () => (node: T) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(node)
        } else if (ref && typeof ref === "object") {
          ;(ref as React.MutableRefObject<T | null>).current = node
        }
      })
    },
    refs
  )
}

export default useCombinedRefs
