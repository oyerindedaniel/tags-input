"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { X } from "lucide-react"

import { useCombinedRefs } from "@repo/hooks/use-combined-ref"
import { useControllableState } from "@repo/hooks/use-controllable-state"
import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import { cn } from "@repo/ui/utils"

type Primitive = string | number

type Wrapper<T extends Primitive> = {
  value: T
  _isPrimitiveWrapper?: true
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
  focusedIndex: number | null
  isTagNonInteractive: boolean
  focusTag: (index: number | null) => void
  isTagFocused: (index: number) => boolean
}

// Component Props
interface TagsInputProps<T extends Tag<Primitive>>
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onChange" | "defaultValue"
  > {
  value: T[]
  onChange: (updatedTags: T[] | ((prevTags: T[]) => T[])) => void
  parseInput?: (input: T) => T | null // Function to parse input
  idKey?: string
  maxTags?: number // Maximum number of tags
  minTags?: number // Minimum number of tags
  allowDuplicates?: boolean // Whether duplicates are allowed
  caseSensitiveDuplicates?: boolean // Case-sensitive duplicate checks true -> "allowed" | false -> "not-allowed"
  disabled?: boolean // Disable the entire component
  readOnly?: boolean // Prevent adding/removing tags
  keyboardCommands?: Partial<
    Record<React.KeyboardEvent["key"], "add" | "remove">
  > // Keyboard commands mapping
}

const defaultKeyboardCommands: Record<
  React.KeyboardEvent["key"],
  "add" | "remove"
> = {
  Enter: "add",
  Backspace: "remove",
}

interface TagsInputItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, ""> {
  asChild?: boolean
  keyIndex: number
}
interface TagsInputItemTextProps
  extends React.HTMLAttributes<HTMLSpanElement> {}
interface TagsInputItemGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {}
interface TagsInputItemDeleteProps
  extends React.HTMLAttributes<HTMLButtonElement> {}
interface TagsInputInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  delimiters?: Delimiters[]
}

export enum TagsInputKeyActions {
  Add = "add",
  Remove = "remove",
  NavigateLeft = "navigateLeft",
  NavigateRight = "navigateRight",
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

const defaultKeyBindings: Record<
  React.KeyboardEvent["key"],
  TagsInputKeyActions
> = {
  Enter: TagsInputKeyActions.Add,
  Backspace: TagsInputKeyActions.Remove,
  ArrowLeft: TagsInputKeyActions.NavigateLeft,
  ArrowRight: TagsInputKeyActions.NavigateRight,
}

const TagsInputContext = React.createContext<TagsInputContextType<
  Tag<Primitive>
> | null>(null)

const useTagsInputContext = <
  T extends Tag<Primitive>,
>(): TagsInputContextType<T> => {
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

const TagsInput = forwardRefWithGenerics(
  <T extends Tag<Primitive>>(
    {
      value = [],
      onChange,
      className,
      children,
      idKey = "_id",
      maxTags,
      minTags,
      allowDuplicates = false,
      caseSensitiveDuplicates = false,
      disabled = false,
      readOnly = false,
      keyboardCommands = defaultKeyboardCommands,
      parseInput = (input) => input as T,
      ...props
    }: TagsInputProps<T>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const initializeTags = (values: T[]): T[] =>
      values.map((value) =>
        typeof value === "object" && value !== null
          ? ({ ...value, [idKey]: crypto.randomUUID() } as T)
          : ({
              [idKey]: crypto.randomUUID(),
              value,
              _isPrimitiveWrapper: true,
            } as T)
      )

    const [_tags, _setTags] = useControllableState({
      prop: initializeTags(value),
      onChange: onChange,
    })

    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const isTagNonInteractive = disabled || readOnly

    const tags = _tags ?? []

    const setTags = React.useCallback(
      (updatedTags: T[] | ((prevTags: T[]) => T[])) => {
        console.log("danie")
        // Type guard to check if a tag is an object (ExtendedObject<Primitive>)
        const isExtendedObject = (
          tag: unknown
        ): tag is ExtendedObject<Primitive> => {
          return typeof tag === "object" && tag !== null && "value" in tag
        }

        // Sanitize tags by removing the `idKey` only from ExtendedObject types
        const sanitizeTags = (tags: T[]): T[] =>
          tags.map((tag) => {
            if (isExtendedObject(tag)) {
              // Destructure to exclude `idKey`
              const {
                [idKey]: _,
                _isPrimitiveWrapper,
                ...rest
              } = tag as ExtendedObject<Primitive>

              // If it's a primitive wrapper, return the primitive value
              if (_isPrimitiveWrapper) {
                console.log("in here")
                return rest.value as T
              }
              console.log(rest)
              return rest as T
            }
            console.log("outside")
            return tag
          })

        const resolveTags = (prevTags: T[]): T[] => {
          const tags =
            typeof updatedTags === "function"
              ? updatedTags(prevTags)
              : updatedTags
          return sanitizeTags(tags)
        }

        _setTags((prevTags) => {
          console.log("charis", resolveTags(prevTags ?? []))
          return resolveTags(prevTags ?? [])
        })
      },
      [onChange, _setTags, idKey]
    )

    const focusTag = React.useCallback((index: number | null) => {
      setFocusedIndex(index)
      if (index === null) {
        inputRef.current?.focus()
      }
    }, [])

    const isTagFocused = React.useCallback(
      (index: number) => focusedIndex === index,
      [focusedIndex]
    )

    // Helper function to normalize tag values for comparison
    const normalizeTag = (tag: T, caseSensitive: boolean): string => {
      if (typeof tag === "object" && tag !== null) {
        return caseSensitive
          ? String(tag.value)
          : String(tag.value).toLowerCase()
      }
      return caseSensitive ? String(tag) : String(tag).toLowerCase()
    }

    // Check for duplicates based on the original tag
    const isDuplicate = React.useCallback(
      (tag: T | T[]) => {
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
          .filter((singleTag) => allowDuplicates || !isDuplicate(singleTag))
          .map((singleTag) =>
            typeof singleTag === "object" && singleTag !== null
              ? { ...singleTag, [idKey]: crypto.randomUUID() }
              : ({
                  [idKey]: crypto.randomUUID(),
                  value: singleTag,
                  _isPrimitiveWrapper: true,
                } as T)
          )

        if (newTags.length > 0) {
          setTags((prevTags) => [...prevTags, ...newTags])
        }
      },
      [tags, idKey, allowDuplicates, isDuplicate, maxTags, disabled, readOnly]
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
        disabled,
        readOnly,
        focusedIndex,
        focusTag,
        isTagNonInteractive,
        isTagFocused,
      }),
      [tags, addTag, removeTag]
    )

    return (
      <TagsInputContext.Provider
        value={contextValue as unknown as TagsInputContextType<Tag<Primitive>>}
      >
        <div
          ref={ref}
          className={cn("flex flex-col space-y-2", className)}
          {...props}
        >
          {children}
        </div>
      </TagsInputContext.Provider>
    )
  }
)

TagsInput.displayName = "TagsInput"

const TagsInputItemGroup: React.FC<TagsInputItemGroupProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}
      {...props}
    >
      {children}
    </div>
  )
}

TagsInputItemGroup.displayName = "TagsInputItemGroup"

const TagsInputItemContext = React.createContext<{ keyIndex: number } | null>(
  null
)

const useTagsInputItemContext = () => {
  const context = React.useContext(TagsInputItemContext)

  if (!context) {
    throw new Error(
      "TagsInputItem components must be used within a TagsInputItem."
    )
  }

  return context
}

const TagsInputItem = React.forwardRef<HTMLDivElement, TagsInputItemProps>(
  ({ className, children, keyIndex, asChild, ...props }, ref) => {
    const {
      focusTag,
      isTagFocused,
      removeTag,
      inputRef,
      tags,
      isTagNonInteractive,
    } = useTagsInputContext()

    const Comp = asChild ? Slot : "div"

    const focusInput = () => {
      if (!inputRef.current) return
      inputRef.current.focus()
    }

    const handleTagKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (isTagNonInteractive) return

        const action = defaultKeyBindings[e.key]
        if (!action) return

        switch (action) {
          case TagsInputKeyActions.Remove:
            // Removes the current tag on Backspace
            if (isTagFocused(keyIndex)) {
              e.preventDefault()
              removeTag(keyIndex)
              focusTag(Math.max(0, keyIndex - 1)) // Focus the previous tag if it exists
            }
            break

          case TagsInputKeyActions.NavigateLeft:
            // Focus the previous tag

            e.preventDefault()
            focusTag(Math.max(0, keyIndex - 1))

            break

          case TagsInputKeyActions.NavigateRight:
            // Focuses the next tag or the input if at the end
            if (keyIndex < tags.length - 1) {
              e.preventDefault()
              focusTag(keyIndex + 1)
            } else {
              e.preventDefault()
              focusInput() // Focus the input if at the last tag
            }
            break

          default:
            break
        }
      },
      [
        isTagNonInteractive,
        keyIndex,
        tags,
        isTagFocused,
        removeTag,
        focusTag,
        focusInput,
      ]
    )

    const contextValue = React.useMemo<{ keyIndex: number }>(
      () => ({ keyIndex }),
      [keyIndex]
    )

    return (
      <TagsInputItemContext.Provider value={contextValue}>
        <Comp
          ref={ref}
          tabIndex={0}
          onFocus={() => focusTag(keyIndex)}
          onKeyDown={handleTagKeyDown}
          className={cn(
            "flex items-center justify-between rounded-md border-transparent bg-primary px-2 py-[5px] text-primary-foreground",
            className,
            isTagFocused(keyIndex) && "bg-blue-200"
          )}
          {...props}
        >
          {children}
        </Comp>
      </TagsInputItemContext.Provider>
    )
  }
)

TagsInputItem.displayName = "TagsInputItem"

const TagsInputItemText: React.FC<TagsInputItemTextProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <span className={cn("flex items-center text-sm", className)} {...props}>
      {children}
    </span>
  )
}

TagsInputItemText.displayName = "TagsInputItemText"

const TagsInputItemDelete = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { removeTag, isTagNonInteractive } = useTagsInputContext()

  const { keyIndex } = useTagsInputItemContext()

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
      variant="ghost"
      size="icon"
      className={cn("ml-2 h-5 w-5", className)}
      onClick={handleRemove}
      disabled={isTagNonInteractive}
      {...props}
    >
      <X />
    </Button>
  )
})

TagsInputItemDelete.displayName = "TagsInputItemDelete"

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
      delimiters = [Delimiters.Comma, Delimiters.Space],
      ...props
    },
    ref
  ) => {
    const { addTag, inputRef: inputParentRef } = useTagsInputContext()

    const isInputNonInteractive = disabled || readOnly

    const inputRef = React.useRef<HTMLInputElement>(null)

    const combinedRef = useCombinedRefs(ref, inputRef, inputParentRef)

    const useDelimiterRegex = (delimiters: Delimiters[]): RegExp => {
      return React.useMemo(() => {
        const patterns = delimiters.map(
          (delimiter) => DelimiterPatterns[delimiter]
        )
        return new RegExp(patterns.map((regex) => regex.source).join("|"), "g")
      }, [delimiters])
    }

    const delimiterRegex = useDelimiterRegex(delimiters)

    const processInputValue = (value: string) => {
      const trimmedValue = value.trim()

      if (!trimmedValue) return

      if (delimiterRegex.test(trimmedValue)) {
        const tags = trimmedValue
          .split(delimiterRegex)
          .map((tag) => tag.trim())
          .filter(Boolean)

        addTag(tags)
      } else {
        addTag(trimmedValue)
      }
    }

    const handleInputKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isInputNonInteractive || !inputRef.current) return

        const command = defaultKeyBindings[e.key]
        if (command === defaultKeyBindings.Enter) {
          e.preventDefault()
          processInputValue(inputRef.current.value)
          inputRef.current.value = ""
        }
      },
      [defaultKeyBindings, addTag, isInputNonInteractive, delimiterRegex]
    )

    const handleInputPaste = React.useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (isInputNonInteractive) return

        const pasteData = e.clipboardData.getData("text")

        processInputValue(pasteData)
        e.preventDefault()
      },
      [addTag, isInputNonInteractive]
    )

    return (
      <Input
        ref={combinedRef}
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
  TagsInputItemGroup,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
}
