"use client"

import type { VariantProps } from "class-variance-authority"
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"

import { useControllableState } from "@repo/hooks/use-controllable-state"
import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import { cn } from "@repo/ui/utils"

type Primitive = string | number

type Wrapper<T extends Primitive> = {
  value: T
}

type ExtendedObject<T extends Primitive> = Wrapper<T> & {
  [key: string]: unknown
}

type Tag<T extends Primitive> = T | Wrapper<T> | ExtendedObject<T>

// Context Type
interface TagsInputContextType<T extends Tag<Primitive>> {
  tags: T[]
  addTag: (tag: T | T[]) => void
  removeTag: (index: number) => void
  inputRef: React.RefObject<HTMLInputElement>
  keyboardCommands: Record<React.KeyboardEvent["key"], TagsInputKeyActions>
  isTagNonInteractive: boolean
}

// Component Props
interface TagsInputProps<T extends Tag<Primitive>>
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onChange" | "defaultValue"
  > {
  value: T[]
  onChange: (updatedTags: T[] | ((prevTags: T[]) => T[])) => void
  parseInput?: (input: Primitive) => ExtendedObject<Primitive> // Function to parse input (necessary if value is an object)
  orientation?: "row" | "column"
  inline?: boolean
  maxTags?: number // Maximum number of tags
  minTags?: number // Minimum number of tags
  allowDuplicates?: boolean // Whether duplicates are allowed
  caseSensitiveDuplicates?: boolean // Case-sensitive duplicate checks true -> "allowed" | false -> "not-allowed"
  disabled?: boolean // Disable the entire component
  readOnly?: boolean // Prevent adding/removing tags
  keyboardCommands?: Record<React.KeyboardEvent["key"], TagsInputKeyActions>
  // Keyboard commands mapping
}

interface TagsInputItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagsInputItemVariants> {
  asChild?: boolean
}
interface TagsInputItemTextProps
  extends React.HTMLAttributes<HTMLSpanElement> {}
interface TagsInputGroupProps extends React.HTMLAttributes<HTMLDivElement> {}
interface TagsInputItemDeleteProps
  extends React.HTMLAttributes<HTMLButtonElement> {}
interface TagsInputInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  delimiters?: Delimiters[]
}

export enum Delimiters {
  Comma = ",",
  Semicolon = ";",
  Space = " ",
}

const DelimiterPatterns: Record<Delimiters, RegExp> = {
  [Delimiters.Comma]: /,\s*/,
  [Delimiters.Semicolon]: /;\s*/,
  [Delimiters.Space]: /\s+/,
}

export enum TagsInputKeyActions {
  Add = "add",
  Remove = "remove",
  NavigateLeft = "navigateLeft",
  NavigateRight = "navigateRight",
}

const defaultKeyBindings: Record<
  React.KeyboardEvent["key"],
  TagsInputKeyActions
> = {
  Enter: TagsInputKeyActions.Add,
  Delete: TagsInputKeyActions.Remove,
  Backspace: TagsInputKeyActions.Remove,
  ArrowLeft: TagsInputKeyActions.NavigateLeft,
  ArrowRight: TagsInputKeyActions.NavigateRight,
}

const TagsInputContext = React.createContext<TagsInputContextType<
  Tag<Primitive>
> | null>(null)

const useTagsInput = <T extends Tag<Primitive>>(): TagsInputContextType<T> => {
  const context = React.useContext(
    TagsInputContext as unknown as React.Context<TagsInputContextType<T>>
  )

  if (!context) {
    throw new Error("TagsInput components must be used within a TagsInput.")
  }

  return context as TagsInputContextType<T>
}

const forwardRefWithGenerics = <
  T extends Tag<Primitive>,
  P extends TagsInputProps<T>,
  R extends HTMLDivElement,
>(
  render: React.ForwardRefRenderFunction<R, React.PropsWithoutRef<P>>
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<R>
> => {
  return React.forwardRef<R, P>(render)
}

function mergeRefs<T>(
  ...refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>
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

function isPlainObject<T extends Primitive>(
  value: unknown
): value is ExtendedObject<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  )
}

const TagsInput = forwardRefWithGenerics(
  <T extends Tag<Primitive>>(
    {
      value,
      onChange,
      className,
      children,
      orientation = "column",
      inline = false,
      maxTags,
      minTags,
      allowDuplicates = false,
      caseSensitiveDuplicates = false,
      disabled = false,
      readOnly = false,
      keyboardCommands = defaultKeyBindings,
      parseInput,
      ...props
    }: TagsInputProps<T>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const [_tags, _setTags] = useControllableState({
      prop: value,
      onChange,
    })

    const inputRef = React.useRef<HTMLInputElement>(null)

    const isTagNonInteractive = disabled || readOnly

    const tags = _tags ?? []

    const setTags = React.useCallback(
      (updatedTags: T[] | ((prevTags: T[]) => T[])) => {
        const resolveTags = (prevTags: T[]): T[] => {
          const tags =
            typeof updatedTags === "function"
              ? updatedTags(prevTags)
              : updatedTags
          return tags
        }

        _setTags((prevTags) => {
          return resolveTags(prevTags ?? [])
        })
      },
      [onChange, _setTags]
    )

    // Helper function to normalize tag values for comparison
    const normalizeTag = (tag: T, caseSensitive: boolean): string => {
      if (isPlainObject(tag)) {
        return caseSensitive
          ? String(tag.value)
          : String(tag.value).toLowerCase()
      }
      return caseSensitive ? String(tag) : String(tag).toLowerCase()
    }

    // Check for duplicates based on the original tag
    const isDuplicate = React.useCallback(
      (tag: T | T[]): boolean => {
        const tagsToCheck = Array.isArray(tag) ? tag : [tag]
        const normalizedTags = tags.map((t) =>
          normalizeTag(t, caseSensitiveDuplicates)
        )

        return tagsToCheck.some((singleTag) => {
          const normalizedTag = normalizeTag(singleTag, caseSensitiveDuplicates)
          return normalizedTags.includes(normalizedTag)
        })
      },
      [tags, caseSensitiveDuplicates]
    )

    const memoizedParseInput = React.useMemo(() => parseInput, [])

    const addTag = React.useCallback(
      (tag: T | T[]) => {
        if (
          disabled ||
          readOnly ||
          tag == null ||
          (maxTags && tags.length >= maxTags) ||
          (minTags && tags.length < minTags)
        ) {
          return
        }

        const tagsToAdd = Array.isArray(tag) ? tag : [tag]

        const newTags = tagsToAdd
          .map((singleTag) => {
            const parsedTag = memoizedParseInput
              ? memoizedParseInput(singleTag as Primitive)
              : singleTag

            return parsedTag as T
          })
          .filter(
            (singleTag) =>
              singleTag != null && (allowDuplicates || !isDuplicate(singleTag))
          )

        if (newTags.length > 0) {
          setTags((prevTags) => [...prevTags, ...newTags])
        }
      },
      [
        tags,
        maxTags,
        minTags,
        allowDuplicates,
        isDuplicate,
        disabled,
        readOnly,
        memoizedParseInput,
      ]
    )

    const removeTag = React.useCallback(
      (index: number) => {
        const updatedTags = tags.filter((_, i) => i !== index)
        setTags(updatedTags)
      },
      [tags]
    )

    const contextValue = React.useMemo<TagsInputContextType<T>>(
      () => ({
        tags,
        addTag,
        removeTag,
        inputRef,
        keyboardCommands,
        isTagNonInteractive,
      }),
      [tags, addTag, removeTag]
    )

    return (
      <div
        ref={ref}
        data-orientation={orientation}
        data-inline={inline}
        className={cn("group flex flex-col space-y-2", className)}
        {...props}
      >
        <TagsInputContext.Provider
          value={
            contextValue as unknown as TagsInputContextType<Tag<Primitive>>
          }
        >
          {children}
        </TagsInputContext.Provider>
      </div>
    )
  }
)

TagsInput.displayName = "TagsInput"

const TagsInputGroupContext = React.createContext<{
  keyIndex: number
} | null>(null)

const useTagsInputGroup = () => {
  const context = React.useContext(TagsInputGroupContext)

  if (!context) {
    throw new Error("Components must be used within a TagsInputGroup Provider.")
  }

  return context
}

const TagsInputGroup: React.FC<TagsInputGroupProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 group-data-[orientation=column]:flex-row group-data-[orientation=row]:flex-col",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return (
            <TagsInputGroupContext.Provider value={{ keyIndex: index }}>
              {child}
            </TagsInputGroupContext.Provider>
          )
        }
        return child
      })}
    </div>
  )
}

TagsInputGroup.displayName = "TagsInputGroup"

const tagsInputItemVariants = cva(
  "flex items-center justify-between rounded-md text-primary-foreground transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 group-data-[orientation=row]:w-full [&_svg]:shrink-0 disabled:[&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background text-accent-foreground hover:bg-accent hover:text-accent-foreground/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "text-accent-foreground hover:bg-accent hover:text-accent-foreground/80",
      },
      size: {
        default: "h-8 px-2 text-sm",
        sm: "h-7 px-2 text-xs",
        lg: "h-10 px-4 text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const TagsInputItem = React.forwardRef<HTMLDivElement, TagsInputItemProps>(
  (
    {
      className,
      children,
      asChild = false,
      variant,
      size,
      onKeyDown,
      ...props
    },
    forwardedRef
  ) => {
    const { removeTag, inputRef, isTagNonInteractive, keyboardCommands } =
      useTagsInput()

    const { keyIndex } = useTagsInputGroup()

    const Comp = asChild ? Slot : "div"

    const itemRef = React.useRef<HTMLElement | null>(null)

    const keyBindings = React.useMemo(() => {
      return { ...defaultKeyBindings, ...keyboardCommands }
    }, [defaultKeyBindings, keyboardCommands])

    const focusInput = () => {
      if (!inputRef.current) return
      inputRef.current.focus()
    }

    const isFocused = () => document.activeElement === itemRef.current

    const handleTagKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onKeyDown) {
          onKeyDown(e)

          if (e.defaultPrevented) {
            return
          }
        }

        if (isTagNonInteractive) {
          return
        }

        const action = keyBindings[e.key]
        if (!action) return

        switch (action) {
          case TagsInputKeyActions.Remove:
            if (isFocused()) {
              e.preventDefault()
              removeTag(keyIndex) // Removes the current tag
            }
            break

          case TagsInputKeyActions.NavigateLeft: {
            e.preventDefault()
            const prevSibling = itemRef.current
              ?.previousElementSibling as HTMLElement | null
            prevSibling?.focus() // Move focus to the previous tag
            break
          }

          case TagsInputKeyActions.NavigateRight: {
            e.preventDefault()
            const nextSibling = itemRef.current
              ?.nextElementSibling as HTMLElement
            if (nextSibling) {
              nextSibling.focus() // Move focus to the next tag
            } else {
              focusInput() // Focuses the input field
            }
            break
          }

          default:
            break
        }
      },
      [onKeyDown, removeTag, focusInput]
    )

    return (
      <Comp
        ref={mergeRefs(forwardedRef, itemRef)}
        data-id={keyIndex}
        tabIndex={0}
        aria-label={`Tag ${keyIndex + 1}`}
        onKeyDown={handleTagKeyDown}
        className={cn(tagsInputItemVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)

TagsInputItem.displayName = "TagsInputItem"

const TagsInputItemText = React.forwardRef<
  HTMLDivElement,
  TagsInputItemTextProps
>(({ className, children, ...props }, ref) => {
  return (
    <span className={cn("", className)} ref={ref} {...props}>
      {children}
    </span>
  )
})

TagsInputItemText.displayName = "TagsInputItemText"

const TagsInputItemDelete = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { removeTag, isTagNonInteractive } = useTagsInput()
  const { keyIndex } = useTagsInputGroup()

  const handleRemove = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      if (isTagNonInteractive) return
      removeTag(keyIndex)
    },
    [removeTag, keyIndex, isTagNonInteractive]
  )

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon"
      className={cn("ml-2 h-5 w-5", className)}
      onClick={handleRemove}
      disabled={isTagNonInteractive}
      {...props}
    >
      <X aria-hidden />
      <span className="sr-only">remove tag</span>
    </Button>
  )
})

TagsInputItemDelete.displayName = "TagsInputItemDelete"

const TagsInputInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input> & { delimiters?: Delimiters[] }
>(
  (
    {
      className,
      disabled = false,
      readOnly = false,
      delimiters = [Delimiters.Comma],
      ...props
    },
    forwardedRef
  ) => {
    const {
      addTag,
      inputRef: inputContextRef,
      keyboardCommands,
    } = useTagsInput()

    const keyBindings = React.useMemo(() => {
      return { ...defaultKeyBindings, ...keyboardCommands }
    }, [defaultKeyBindings, keyboardCommands])

    const isInputNonInteractive = disabled || readOnly

    const inputRef = React.useRef<HTMLInputElement>(null)

    const useDelimiterRegex = (delimiters: Delimiters[]): RegExp => {
      return React.useMemo(() => {
        const patterns = delimiters.map(
          (delimiter) => DelimiterPatterns[delimiter]
        )
        return new RegExp(patterns.map((regex) => regex.source).join("|"), "g")
      }, [delimiters])
    }

    const delimiterRegex = useDelimiterRegex(delimiters)

    const processInputValue = React.useCallback(
      (value: string) => {
        const trimmedValue = value.trim()

        if (!trimmedValue) return

        if (delimiterRegex.test(trimmedValue)) {
          const tags = trimmedValue
            .split(delimiterRegex)
            .map((tag) => {
              const trimmedTag = tag.trim()
              return !isNaN(Number(trimmedTag))
                ? Number(trimmedTag)
                : trimmedTag
            })
            .filter(Boolean)
          addTag(tags)
        } else {
          const singleTag = !isNaN(Number(trimmedValue))
            ? Number(trimmedValue)
            : trimmedValue
          addTag(singleTag)
        }
      },
      [delimiterRegex, addTag]
    )

    const handleInputKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isInputNonInteractive || !inputRef.current) return

        const command = keyBindings[e.key]
        if (command === TagsInputKeyActions.Add) {
          e.preventDefault()
          processInputValue(inputRef.current.value)
          inputRef.current.value = ""
        }
      },
      [keyBindings, isInputNonInteractive, processInputValue]
    )

    const handleInputPaste = React.useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (isInputNonInteractive) return

        const pasteData = e.clipboardData.getData("text")

        processInputValue(pasteData)
        e.preventDefault()
      },
      [addTag, isInputNonInteractive, processInputValue]
    )

    return (
      <Input
        ref={mergeRefs(forwardedRef, inputRef, inputContextRef)}
        autoComplete="off"
        autoCorrect="off"
        disabled={disabled}
        readOnly={readOnly}
        onKeyDown={handleInputKeyDown}
        onPaste={handleInputPaste}
        className={cn("flex-grow", className)}
        {...props}
      />
    )
  }
)

TagsInputInput.displayName = "TagsInputInput"

export {
  TagsInput,
  TagsInputGroup,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
}
