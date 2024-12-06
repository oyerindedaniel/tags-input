import React, {
  createContext,
  forwardRef,
  KeyboardEvent,
  useContext,
} from "react"
import { twMerge } from "tailwind-merge"

import useCombinedRefs from "@repo/hooks/use-combined-ref"

type Primitive = string | number

type ExtendedObject<T extends Primitive, K extends Primitive = T> = {
  id: T
  value: K
  [key: string]: unknown
}

// Context Type
interface TagsInputContextType<T extends ExtendedObject<Primitive>> {
  tags: T[]
  addTag: (tag: Primitive) => void
  removeTag: (index: number) => void
  disabled: boolean
  readOnly: boolean
  focusedIndex: number | null
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
  onChange: (tags: T[]) => void
  parseInput?: (input: T) => T | null // Function to parse input
  idKey?: keyof T
  maxTags?: number // Maximum number of tags
  minTags?: number // Minimum number of tags
  allowDuplicates?: boolean // Whether duplicates are allowed
  caseSensitiveDuplicates?: boolean // Case-sensitive duplicate checks
  truncateTags?: number // Maximum characters/words for each tag
  disabled?: boolean // Disable the entire component
  readOnly?: boolean // Prevent adding/removing tags
  keyboardCommands?: Partial<
    Record<React.KeyboardEvent["key"], "add" | "remove">
  > // Keyboard commands mapping
}

const defaultKeyboardCommands: {
  [K in React.KeyboardEvent["key"]]?: "add" | "remove"
} = {
  Enter: "add",
  Backspace: "remove",
}

// Subcomponent Props
interface TagsInputItemProps extends React.HTMLAttributes<HTMLDivElement> {}
interface TagsInputItemTextProps
  extends React.HTMLAttributes<HTMLSpanElement> {}
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

const TagsInputContext = createContext<TagsInputContextType<
  ExtendedObject<Primitive>
> | null>(null)

const useTagsInputContext = <
  T extends ExtendedObject<Primitive>,
>(): TagsInputContextType<T> => {
  const context = useContext(
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
  return forwardRef<R, P>(render)
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
      allowDuplicates = true,
      caseSensitiveDuplicates = true,
      truncateTags,
      disabled = false,
      readOnly = false,
      keyboardCommands = defaultKeyboardCommands,
      parseInput = (input) => input as T,
      ...props
    }: TagsInputProps<T>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const [tags, setTags] = React.useState<T[]>(value || defaultValue)
    const [originalTags, setOriginalTags] = React.useState<T["value"][]>(
      defaultValue.map((t) => t.value)
    )

    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const stableOnChange = React.useCallback(onChange, [])

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
        setTags((prevTags) =>
          prevTags.map((tag, index) => ({
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
        stableOnChange?.(updatedTags)
      },
      [
        tags,
        stableOnChange,
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
        stableOnChange?.(updatedTags)
      },
      [tags, stableOnChange]
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
          className={twMerge("flex items-center space-x-2", className)}
          {...props}
        >
          {children}
        </div>
      </TagsInputContext.Provider>
    )
  }
)

TagsInput.displayName = "TagsInput"

const TagsInputItem = React.forwardRef<HTMLDivElement, TagsInputItemProps>(
  ({ className, children, ...props }, ref) => {
    const { focusTag, isTagFocused, removeTag, disabled, tags } =
      useTagsInputContext()

    // const handleKeyDown = React.useCallback(
    //   (e: React.KeyboardEvent<HTMLDivElement>) => {
    //     if (disabled) return

    //     if (e.key === "Backspace") {
    //       removeTag(tags.findIndex((tag) => isTagFocused(tag)))
    //     } else if (e.key === "ArrowLeft") {
    //       focusTag((prev) =>
    //         prev !== null ? Math.max(0, prev - 1) : tags.length - 1
    //       )
    //     } else if (e.key === "ArrowRight") {
    //       focusTag((prev) =>
    //         prev !== null ? Math.min(tags.length - 1, prev + 1) : 0
    //       )
    //     }
    //   },
    //   [focusTag, isTagFocused, removeTag, tags, disabled]
    // )

    return (
      <div
        ref={ref}
        tabIndex={0}
        // onFocus={() => focusTag(tags.findIndex((tag) => isTagFocused(tag)))}
        // onKeyDown={handleKeyDown}
        // className={twMerge("flex items-center rounded px-2 py-1", className, {
        //   "bg-blue-200": isTagFocused(
        //     tags.findIndex((tag) => isTagFocused(tag))
        //   ),
        // })}
        {...props}
      >
        {children}
      </div>
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
    <span className={twMerge("text-sm", className)} {...props}>
      {children}
    </span>
  )
}

TagsInputItemText.displayName = "TagsInputItemText"

const TagsInputItemDelete = React.forwardRef<
  HTMLButtonElement,
  TagsInputItemDeleteProps
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={twMerge("ml-2 text-red-500", className)}
      {...props}
    >
      ×
    </button>
  )
})

TagsInputItemDelete.displayName = "TagsInputItemDelete"

const TagsInputInput = React.forwardRef<HTMLInputElement, TagsInputInputProps>(
  (
    {
      className,
      children,
      disabled = false,
      readOnly = false,
      delimiters = [Delimiters.Comma],
      ...props
    },
    ref
  ) => {
    const { addTag } = useTagsInputContext()

    const isInputNonInteractive = disabled || readOnly

    const inputRef = React.useRef<HTMLInputElement>(null)

    const combinedRef = useCombinedRefs(ref, inputRef)

    const useDelimiterRegex = (delimiters: Delimiters[]): RegExp => {
      return React.useMemo(() => {
        const patterns = delimiters.map(
          (delimiter) => DelimiterPatterns[delimiter]
        )
        return new RegExp(patterns.map((regex) => regex.source).join("|"), "g")
      }, [delimiters])
    }

    const delimiterRegex = useDelimiterRegex(delimiters)

    const processInputValue = (
      value: string,
      delimiterRegex: RegExp,
      addTag: (tag: string) => void
    ) => {
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
          processInputValue(inputRef.current.value, delimiterRegex, addTag)
          inputRef.current.value = ""
        }
      },
      [defaultKeyBindings, addTag, isInputNonInteractive, delimiterRegex]
    )

    const handleInputPaste = React.useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (isInputNonInteractive) return

        const pasteData = e.clipboardData.getData("text")

        processInputValue(pasteData, delimiterRegex, addTag)
        e.preventDefault()
      },
      [addTag, isInputNonInteractive]
    )

    return (
      <input
        ref={combinedRef}
        disabled={disabled}
        readOnly={readOnly}
        onKeyDown={handleInputKeyDown}
        onPaste={handleInputPaste}
        className={twMerge("flex-grow bg-transparent outline-none", className)}
        {...props}
      />
    )
  }
)

TagsInputInput.displayName = "TagsInputInput"

export {
  TagsInput,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
}
