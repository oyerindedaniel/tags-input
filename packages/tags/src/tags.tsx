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
  [key: Primitive]: unknown
}

type Tag<T extends Primitive> = T | Wrapper<T> | ExtendedObject<T>

// Context Type
interface TagsInputContextType<T extends Tag<Primitive>> {
  tags: T[]
  addTag: (tag: Primitive | Primitive[]) => void
  removeTag: (index: number) => void
  inputRef: React.RefObject<HTMLInputElement>
  keyBindings: Record<React.KeyboardEvent["key"], TagsInputKeyActions>
  isTagNonInteractive: boolean
}

// Component Props
interface TagsInputProps<T extends Tag<Primitive>>
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onChange" | "defaultValue"
  > {
  value?: T[]
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

function forwardRefWithGenerics<
  T extends Tag<Primitive>,
  P extends TagsInputProps<T>,
  R extends HTMLDivElement,
>(
  render: React.ForwardRefRenderFunction<R, React.PropsWithoutRef<P>>
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<R>
> {
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
      ...rest
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

    const keyBindings = React.useMemo(() => {
      return { ...defaultKeyBindings, ...keyboardCommands }
    }, [defaultKeyBindings, keyboardCommands])

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
      [_setTags]
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
        const normalizedTags = tags.map((tag) =>
          normalizeTag(tag, caseSensitiveDuplicates)
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
      (tag: Primitive | Primitive[]) => {
        if (
          isTagNonInteractive ||
          tag == null ||
          (maxTags && tags.length >= maxTags) ||
          (minTags && tags.length < minTags)
        ) {
          return
        }

        const tagsToAdd = Array.isArray(tag) ? tag : [tag]

        // Normalizes the incoming tags for deduplication within the batch
        const normalizedExistingTags = new Set(
          tags.map((tag) => normalizeTag(tag, caseSensitiveDuplicates))
        )

        const uniqueNormalizedTags = new Set<Primitive>()
        const uniqueTagsToAdd: T[] = []

        for (const singleTag of tagsToAdd) {
          // Preprocesses the tag if parse input function is passed
          const parsedTag = memoizedParseInput
            ? memoizedParseInput(singleTag)
            : singleTag

          const normalizedTag = normalizeTag(
            parsedTag as T,
            caseSensitiveDuplicates
          )

          if (
            !uniqueNormalizedTags.has(normalizedTag) && // Not a duplicate within the batch
            (allowDuplicates || !normalizedExistingTags.has(normalizedTag)) // Not a duplicate in existing tags
          ) {
            uniqueNormalizedTags.add(normalizedTag)
            uniqueTagsToAdd.push(parsedTag as T)
          }
        }

        if (uniqueTagsToAdd.length > 0) {
          setTags((prevTags) => [...prevTags, ...uniqueTagsToAdd])
        }
      },
      [
        tags,
        maxTags,
        minTags,
        allowDuplicates,
        isDuplicate,
        isTagNonInteractive,
        memoizedParseInput,
      ]
    )

    const removeTag = React.useCallback(
      (index: number) => {
        if (isTagNonInteractive) return

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
        keyBindings,
        isTagNonInteractive,
      }),
      [tags, addTag, removeTag]
    )

    return (
      <div
        ref={ref}
        data-orientation={orientation}
        data-inline={inline}
        className={cn(
          "group flex flex-col space-y-2 data-[inline=true]:mx-auto data-[inline=true]:max-w-96 data-[inline=true]:rounded-md data-[inline=true]:border data-[inline=true]:border-secondary data-[inline=true]:px-3 data-[inline=true]:py-2.5",
          className
        )}
        {...rest}
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
  textIdPrefix: string
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
  ...rest
}) => {
  const textId = React.useId()
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 group-data-[orientation=column]:flex-row group-data-[orientation=row]:flex-col",
        className
      )}
      {...rest}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return (
            <TagsInputGroupContext.Provider
              value={{
                keyIndex: index,
                textIdPrefix: `${textId}-tag-${index}`,
              }}
            >
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
  "flex shrink-0 items-center justify-between rounded-md text-primary-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 group-data-[orientation=row]:w-full [&_svg]:shrink-0 disabled:[&_svg]:pointer-events-none",
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
        sm: "h-7 px-2 text-sm",
        lg: "h-10 px-4 text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const TagsInputItem = React.forwardRef<HTMLElement, TagsInputItemProps>(
  (
    { className, children, asChild = false, variant, size, onKeyDown, ...rest },
    forwardedRef
  ) => {
    const { removeTag, inputRef, isTagNonInteractive, keyBindings } =
      useTagsInput()

    const { keyIndex, textIdPrefix } = useTagsInputGroup()

    const Comp = asChild ? Slot : "div"

    const itemRef = React.useRef<HTMLElement | null>(null)

    const focusInput = React.useCallback(() => {
      if (!inputRef.current) return
      inputRef.current.focus()
    }, [])

    const isFocused = () => document.activeElement === itemRef.current

    const handleTagKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onKeyDown) {
          onKeyDown(e)

          if (e.defaultPrevented) {
            return
          }
        }

        if (isTagNonInteractive) return

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
        tabIndex={isTagNonInteractive ? -1 : 0}
        aria-labelledby={textIdPrefix}
        aria-disabled={isTagNonInteractive}
        onKeyDown={handleTagKeyDown}
        className={cn(
          tagsInputItemVariants({ variant, size }),
          isTagNonInteractive &&
            "pointer-events-none cursor-not-allowed opacity-50",
          className
        )}
        {...rest}
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
>(({ className, children, ...rest }, ref) => {
  const { textIdPrefix } = useTagsInputGroup()
  return (
    <span
      id={textIdPrefix}
      aria-hidden
      className={cn("", className)}
      ref={ref}
      {...rest}
    >
      {children}
    </span>
  )
})

TagsInputItemText.displayName = "TagsInputItemText"

const TagsInputItemDelete = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, ...rest }, ref) => {
  const { removeTag, isTagNonInteractive } = useTagsInput()
  const { keyIndex } = useTagsInputGroup()

  const handleRemove = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      removeTag(keyIndex)
    },
    [removeTag, keyIndex]
  )

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      aria-label="delete tag"
      aria-disabled={isTagNonInteractive}
      size="icon"
      className={cn("ml-2 h-5 w-5", className)}
      onClick={handleRemove}
      disabled={isTagNonInteractive}
      {...rest}
    >
      <X aria-hidden />
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
      onPaste,
      onKeyDown,
      disabled = false,
      readOnly = false,
      delimiters = [Delimiters.Comma],
      ...rest
    },
    forwardedRef
  ) => {
    const {
      addTag,
      inputRef: inputContextRef,
      keyBindings,
      isTagNonInteractive,
    } = useTagsInput()

    const isInputNonInteractive = disabled || readOnly || isTagNonInteractive

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
        if (onKeyDown) {
          onKeyDown(e)

          if (e.defaultPrevented) {
            return
          }
        }

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
        if (onPaste) {
          onPaste(e)

          if (e.defaultPrevented) {
            return
          }
        }

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
        autoCapitalize="off"
        aria-disabled={isInputNonInteractive}
        disabled={isInputNonInteractive}
        onKeyDown={handleInputKeyDown}
        onPaste={handleInputPaste}
        className={cn(
          "grow [[data-inline=true][data-orientation=column]_&]:basis-3/5",
          className
        )}
        {...rest}
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
