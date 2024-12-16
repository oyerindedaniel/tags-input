import * as React from "react"

function useDisclosure() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false)

  const onOpen = React.useCallback(() => setIsOpen(true), [])
  const onClose = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), [])

  return {
    isOpen,
    onOpen,
    onClose,
    toggle,
  }
}

export { useDisclosure }
