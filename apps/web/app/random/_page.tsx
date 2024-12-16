"use client"

import React from "react"

function mergeRefs<T>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value)
      } else if (ref != null) {
        ;(ref as React.MutableRefObject<T | null>).current = value
      }
    })
  }
}

// Helper function to render children
function renderChildren(children: React.ReactElement) {
  const childrenType = children.type as any
  console.log("children:", children) // Log the type of children
  // The children is a component
  if (typeof childrenType === "function") return childrenType(children.props)
  // The children is a component with `forwardRef`
  else if ("render" in childrenType) {
    console.log("mid")
    return childrenType.render(children.props)
  }
  // It's a string, boolean, etc.
  else {
    console.log("ast")
    return children
  }
}

// SlottableWithNestedChildren component
function SlottableWithNestedChildren(
  { asChild, children }: { asChild?: boolean; children?: React.ReactNode },
  render: (child: React.ReactNode) => JSX.Element
) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      renderChildren(children),
      { ref: (children as any).ref },
      render(children.props.children)
    )
  }
  console.log("just render")
  return render(children)
}

// Example Functional Component
const ExampleChild = React.forwardRef<
  HTMLDivElement,
  { message: string; children?: React.ReactNode }
>(({ message, children }, ref) => {
  return (
    <div className="example-child" id="dab">
      <span>djjdj</span>
      {/* <span ref={ref}>{children}</span> */}
      {/* <p>Message: {message}</p> */}
    </div>
  )
})

// Example Parent Component
function ParentComponent({ children }: { children: React.ReactNode }) {
  const RenderFunction = {}

  console.log(React.isValidElement("dd"))

  const exampleRef = React.useRef<HTMLDivElement>(null)

  const handleFocus = () => {
    if (exampleRef.current) {
      exampleRef.current.focus() // Example use case
      console.log("Ref accessed:", exampleRef.current)
    }
  }

  return (
    <>
      <div>
        <h2 className="bg-red-300" onClick={handleFocus}>
          Heading
        </h2>
        {SlottableWithNestedChildren(
          {
            asChild: true,
            children: (
              <ExampleChild message="davies" ref={exampleRef}></ExampleChild>
            ),
          },
          (child: React.ReactNode) => (
            <div className="wrapper">
              <h1>Wrapped Child</h1>
              {child}
            </div>
          )
        )}
      </div>
    </>
  )
}

function SuperParentComponent({ children }: { children: React.ReactNode }) {
  return (
    <ParentComponent>
      <div>item 1</div>
      <div>item 2</div>
      <div>item 3</div>
    </ParentComponent>
  )
}

export default SuperParentComponent

{
  /* <ExampleChild message="davies" ref={exampleRef}>
              <div>danie</div>
              <div>sex at night</div>
              <div>ggdg</div>
            </ExampleChild> */
}

// asChild
//             children={<ExampleChild message="Hello, World!" />}},
//             render={(child: React.ReactNode) => (
//               <div className="wrapper">
//                 <h1>Wrapped Child:</h1>
//                 {child}
//               </div>
//             )}
