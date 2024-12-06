"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { X } from "lucide-react"

import useCombinedRefs from "@repo/hooks/use-combined-ref"
import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import { cn } from "@repo/ui/utils"

type Primitive = string | number

type ExtendedObject<T extends Primitive, K extends Primitive = T> = {
  id: T
  value: K
  [key: string]: unknown
}

// Context Type
interface TagsInputContextType<T extends ExtendedObject<Primitive>> {
  tags: T[]
  addTag: (tag: T["value"]) => void
  removeTag: (index: number) => void
  inputRef: React.RefObject<HTMLInputElement>
  focusedIndex: number | null
  isTagNonInteractive: boolean
  focusTag: (index: number | null) => void
  isTagFocused: (index: number) => boolean
}

// Component Props
interface TagsInputProps<T extends ExtendedObject<Primitive>>
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onChange" | "defaultValue"
  > {
  value?: T[]
  defaultValue?: T[]
  onChange?: (tags: T[]) => void
  parseInput?: (input: T) => T | null // Function to parse input
  idKey?: keyof T
  maxTags?: number // Maximum number of tags
  minTags?: number // Minimum number of tags
  allowDuplicates?: boolean // Whether duplicates are allowed
  caseSensitiveDuplicates?: boolean // Case-sensitive duplicate checks true -> "allowed" | false -> "not-allowed"
  truncateTags?: number // Maximum characters/words for each tag
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

// Subcomponent Props
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

// Context
// function createContextWrapper<T extends Primitive>(
//   initial?: TagsInputContextType<T>
// ) {
//   return createContext<TagsInputContextType<T> | undefined>(initial)
// }
// const TagsInputContext = createContextWrapper()

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
  ExtendedObject<Primitive>
> | null>(null)

const useTagsInputContext = <
  T extends ExtendedObject<Primitive>,
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
  T extends ExtendedObject<Primitive>,
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
  <T extends ExtendedObject<Primitive>>(
    {
      value,
      defaultValue = [],
      onChange,
      className,
      children,
      idKey = "id",
      maxTags,
      minTags,
      allowDuplicates = false,
      caseSensitiveDuplicates = false,
      truncateTags,
      disabled = false,
      readOnly = false,
      keyboardCommands = defaultKeyboardCommands,
      parseInput = (input) => input as T,
      ...props
    }: TagsInputProps<T>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const [_tags, _setTags] = React.useState<T[]>(defaultValue)

    const [originalTags, setOriginalTags] = React.useState<T["value"][]>(
      defaultValue.map((t) => t.value)
    )

    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const isTagNonInteractive = disabled || readOnly

    const tags = value ?? _tags

    const setTags = React.useCallback(
      (updatedTags: T[]) => {
        if (onChange) {
          onChange(updatedTags)
        } else {
          _setTags(updatedTags)
        }
      },
      [onChange] // Only depends on onChange
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

    // Check for duplicates based on the original tag
    const isDuplicate = React.useCallback(
      (tag: T["value"]) => {
        const tagValue = caseSensitiveDuplicates
          ? String(tag)
          : String(tag).toLowerCase()
        return tags.some((t) => {
          const existingTag = caseSensitiveDuplicates
            ? String(t.value)
            : String(t.value).toLowerCase()
          return tagValue === existingTag
        })
      },
      [tags, caseSensitiveDuplicates]
    )

    const truncateTag = React.useCallback(
      (tag: T["value"]) => {
        if (typeof tag !== "string" || truncateTags === undefined) return tag
        const words = tag.split(" ")
        return truncateTags <= 0
          ? tag
          : words.length > truncateTags
            ? `${words.slice(0, truncateTags).join(" ")}...`
            : tag
      },
      [truncateTags]
    )

    // Reverse truncation if `truncateTags` is removed
    const reverseTruncateTags = React.useCallback(() => {
      if (truncateTags === undefined) {
        setTags(
          tags.map((tag, index) => ({
            ...tag,
            value: originalTags[index] ?? tag.value,
          }))
        )
      }
    }, [truncateTags, originalTags])

    const addTag = React.useCallback(
      (tag: T["value"]) => {
        if (
          disabled ||
          readOnly ||
          tag == null ||
          (maxTags && tags.length >= maxTags)
        )
          return

        if (!allowDuplicates && isDuplicate(tag)) return

        const truncatedTag = truncateTag(tag)
        const newTag = {
          [idKey]: crypto.randomUUID(),
          value: truncatedTag,
        } as T

        setOriginalTags((prev) => [...prev, tag]) // Keeps track of original tags
        const updatedTags = [...tags, newTag]
        setTags(updatedTags)
      },
      [
        tags,
        idKey,
        allowDuplicates,
        isDuplicate,
        maxTags,
        truncateTag,
        disabled,
        readOnly,
      ]
    )

    const removeTag = React.useCallback(
      (index: number) => {
        setOriginalTags((prev) => prev.filter((_, i) => i !== index))
        const updatedTags = tags.filter((_, i) => i !== index)
        setTags(updatedTags)
      },
      [tags]
    )

    React.useEffect(() => {
      reverseTruncateTags()
    }, [truncateTags, reverseTruncateTags])

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
        value={
          contextValue as unknown as TagsInputContextType<
            ExtendedObject<Primitive>
          >
        }
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
    <div className={cn("flex items-center space-x-2", className)} {...props}>
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
            "rounded border-transparent bg-primary px-2 py-1 text-primary-foreground",
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
      className={cn("ml-2 h-6 w-6", className)}
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
        trimmedValue
          .split(delimiterRegex)
          .map((tag) => tag.trim())
          .filter(Boolean)
          .forEach(addTag)
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
