import { useEffect, useState } from "react"

/**
 * Custom hook to determine if a component is mounted.
 */
export const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState<boolean>(false)

  useEffect(() => {
    setIsMounted(true)
    return () => {
      setIsMounted(false)
    }
  }, [])

  return isMounted
}
