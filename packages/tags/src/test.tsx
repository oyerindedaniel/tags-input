import * as React from "react"

function renderChildren(children: React.ReactElement) {
  const childrenType = children.type as any
  // The children is a component
  if (typeof childrenType === "function") return childrenType(children.props)
  // The children is a component with `forwardRef`
  else if ("render" in childrenType) return childrenType.render(children.props)
  // It's a string, boolean, etc.
  else return children
}

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
  return render(children)
}

// ;<SlottableWithNestedChildren
//   asChild
//   children={<CustomComponent>Some content</CustomComponent>}
//   render={(child) => (
//     <div>
//       <Context.Provider value={value}>{child}</Context.Provider>
//     </div>
//   )}
// />

const props = { asChild: true }

SlottableWithNestedChildren(props, (child) => (
  <div
    cmdk-group-items=""
    role="group"
    // aria-labelledby={heading ? headingId : undefined}
  >
    <div>{child}</div>
  </div>
))

// const MyComponent: React.FC = ({ children, className }) => (
//   <span className={className}>{children}</span>
// );

// Using a custom component:
// const customElement = <MyComponent>Hello</MyComponent>;
// const clonedCustom = React.cloneElement(customElement, { className: "custom-class" }, "New Children");

// console.log(clonedCustom);
// <MyComponent className="custom-class">New Children</MyComponent>

// Rendering produces:
// <span className="custom-class">New Children</span>

// Using a native element:
// const nativeElement = <span>Hello</span>;
// const clonedNative = React.cloneElement(nativeElement, { className: "native-class" }, "New Children");

// console.log(clonedNative);
// <span className="native-class">New Children</span>
