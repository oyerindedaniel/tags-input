# TagsInput Component

The `TagsInput` component is a flexible and customizable React component for inputting, managing, and displaying tags. It supports advanced features like object parsing, duplicate handling, keyboard commands, and customizable delimiters.

---

## Table of Contents

1. [Usage](#usage)
2. [Props](#props)
   - [TagsInput Props](#tagsinput-props)
   - [Input Delimiters](#input-delimiters)
   - [Keyboard Commands](#keyboard-commands)
3. [Examples](#examples)
4. [License](#license)

---

## Usage

### Controlled

```tsx
import React from "react"

import {
  TagsInput,
  TagsInputGroup,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from "@repo/tags/tags-input"

export default function App() {
  const [tags, setTags] = React.useState<string[]>(["tag1", "tag2"])

  return (
    <TagsInput value={tags} onChange={setTags} maxTags={5}>
      <TagsInputGroup>
        {tags.map((tag, idx) => (
          <TagsInputItem key={idx}>
            <TagsInputItemText>{tag}</TagsInputItemText>
            <TagsInputItemDelete />
          </TagsInputItem>
        ))}
        <TagsInputInput placeholder="Add tags..." />
      </TagsInputGroup>
    </TagsInput>
  )
}
```

### Uncontrolled

```tsx
import React from "react"

import {
  TagsInput,
  TagsInputGroup,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from "@repo/tags/tags-input"

export default function App() {
  return (
    <TagsInput maxTags={5}>
      {({ tags }) => (
        <TagsInputGroup>
          {tags.map((tag, idx) => (
            <TagsInputItem key={idx}>
              <TagsInputItemText>{tag}</TagsInputItemText>
              <TagsInputItemDelete />
            </TagsInputItem>
          ))}
          <TagsInputInput placeholder="Add tags..." />
        </TagsInputGroup>
      )}
    </TagsInput>
  )
}
```

---

## Props

### TagsInput Props

| Prop                      | Type                                                      | Description                                                       | Default              |
| ------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- | -------------------- |
| `value`                   | `T[]`                                                     | The array of tags or objects.                                     | `-`                  |
| `defaultValue`            | `T[]`                                                     | Default array of tags to initialize the component with.           | `-`                  |
| `onChange`                | `(updatedTags: T[]) => void`                              | Callback fired when the tags change.                              | `-`                  |
| `parseInput`              | `(input: Primitive) => ExtendedObject<Primitive>`         | Function to parse input into an object (useful for complex tags). | `-`                  |
| `orientation`             | `"row" \| "column"`                                       | Layout orientation of the tags.                                   | `column`             |
| `inline`                  | `boolean`                                                 | Render the tags inline.                                           | `false`              |
| `maxTags`                 | `number`                                                  | Maximum number of tags allowed.                                   | `-`                  |
| `minTags`                 | `number`                                                  | Minimum number of tags required.                                  | `-`                  |
| `allowDuplicates`         | `boolean`                                                 | Allow duplicate tags.                                             | `false`              |
| `caseSensitiveDuplicates` | `boolean`                                                 | Enable case-sensitive duplicate checks.                           | `false`              |
| `disabled`                | `boolean`                                                 | Disable the entire tags input component.                          | `false`              |
| `readOnly`                | `boolean`                                                 | Prevent adding/removing tags.                                     | `false`              |
| `keyboardCommands`        | `Record<React.KeyboardEvent["key"], TagsInputKeyActions>` | Mapping of keyboard actions for managing tags.                    | Default key bindings |

### Input Delimiters

The `TagsInputInput` component supports delimiters for splitting input into multiple tags. The supported delimiters are defined as:

| Delimiter              | Example |
| ---------------------- | ------- |
| `Delimiters.Comma`     | `","`   |
| `Delimiters.Semicolon` | `";"`   |
| `Delimiters.Space`     | `" "`   |

### Example Usage with Delimiters

```tsx
import React from "react"

import {
  Delimiters,
  TagsInput,
  TagsInputGroup,
  TagsInputInput,
  TagsInputItem,
} from "@repo/tags/tags-input"

function App() {
  return (
    <TagsInput>
      <TagsInputGroup>
        <TagsInputInput
          delimiters={[Delimiters.Comma, Delimiters.Space]}
          placeholder="Enter tags separated by commas or spaces"
        />
      </TagsInputGroup>
    </TagsInput>
  )
}
```

### Keyboard Commands

The `keyboardCommands` prop allows customization of keyboard shortcuts for tag management.

| Key          | Action                       |
| ------------ | ---------------------------- |
| `Enter`      | Add a new tag.               |
| `Backspace`  | Remove the last/focused tag. |
| `Delete`     | Remove the last/focused tag. |
| `ArrowLeft`  | Navigate left.               |
| `ArrowRight` | Navigate right.              |

### Example Usage with Commands

```tsx
import React from "react"

import { TagsInput, TagsInputKeyActions } from "@repo/tags/tags-input"

const customKeyboardCommands = {
  Escape: TagsInputKeyActions.Remove,
}

function App() {
  return <TagsInput keyboardCommands={customKeyboardCommands} />
}
```

---

## Examples

### Tags with Custom Object Parsing

This example demonstrates how to parse user input into custom objects:

```tsx
import React from "react"

import {
  TagsInput,
  TagsInputGroup,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemText,
} from "@repo/tags/tags-input"

function App() {
  type Tag = {
    id: number
    value: string
  }

  const [tags, setTags] = React.useState<Tag[]>([])

  return (
    <TagsInput
      value={tags}
      onChange={setTags}
      parseInput={(input) => ({ id: Date.now(), value: input })}
    >
      <TagsInputGroup>
        {tags.map((tag) => (
          <TagsInputItem key={tag.id}>
            <TagsInputItemText>{tag.value}</TagsInputItemText>
          </TagsInputItem>
        ))}
        <TagsInputInput placeholder="Enter tags..." />
      </TagsInputGroup>
    </TagsInput>
  )
}
```

### Tags Input Form with Validation

This example demonstrates how to use the `TagsInput` component in a form, with validation using Zod and React Hook Form.

```tsx
"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  TagsInput,
  TagsInputGroup,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from "@repo/tags/tags-input"
import { Button } from "@repo/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/form"
import { toast } from "@repo/ui/use-toast"

const FormSchema = z.object({
  tags: z
    .array(z.string().min(1, "At least one tag is required"))
    .min(1, { message: "You must enter at least one tag." }),
})

export default function Home() {
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { tags: [] },
  })

  const onSubmit = (data) => {
    toast({
      title: "You submitted the following tags:",
      description: <pre>{JSON.stringify(data, null, 2)}</pre>,
    })
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="tags">
          {({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <TagsInput value={field.value} onChange={field.onChange}>
                  <TagsInputGroup>
                    {field.value.map((tag, idx) => (
                      <TagsInputItem key={idx}>
                        <TagsInputItemText>{tag}</TagsInputItemText>
                        <TagsInputItemDelete />
                      </TagsInputItem>
                    ))}
                    <TagsInputInput
                      placeholder="Enter tags..."
                      ref={field.ref}
                    />
                  </TagsInputGroup>
                </TagsInput>
              </FormControl>
              <FormDescription>These are your tags</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        </FormField>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Command Palette for Tag Selection

This example demonstrates how to integrate a command palette for selecting tags using the `cmdk` library.

```tsx
"use client"

import React from "react"
import { Check } from "lucide-react"

import {
  TagsInput,
  TagsInputGroup,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from "@repo/tags/tags-input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/command"

const randomTags = [
  { label: "Cool", value: "cool" },
  { label: "Awesome", value: "awesome" },
  { label: "Innovative", value: "innovative" },
  { label: "Trendy", value: "trendy" },
  { label: "Modern", value: "modern" },
] as const

export default function CommandPaletteTags() {
  const [tags, setTags] = React.useState<string[]>([])

  return (
    <TagsInput
      value={tags}
      onChange={(updatedTags) => setTags(updatedTags as string[])}
    >
      <TagsInputGroup>
        {tags.map((tag, idx) => (
          <TagsInputItem key={idx}>
            <TagsInputItemText>{tag}</TagsInputItemText>
            <TagsInputItemDelete />
          </TagsInputItem>
        ))}

        <Command>
          <CommandInput asChild>
            <TagsInputInput
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              onPaste={(e) => e.preventDefault()}
              placeholder="Search tags..."
            />
          </CommandInput>
          <CommandList>
            <CommandEmpty>No tag found</CommandEmpty>
            <CommandGroup>
              {randomTags.map((tag) => (
                <CommandItem
                  key={tag.value}
                  value={tag.label}
                  onSelect={() => setTags([...tags, tag.value])}
                >
                  {tag.label}
                  <Check className="ml-auto opacity-100" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </TagsInputGroup>
    </TagsInput>
  )
}
```

### Case-Sensitive Duplicate Handling

```tsx
import React from "react"

import { TagsInput } from "@repo/tags/tags-input"

function App() {
  return <TagsInput allowDuplicates={false} caseSensitiveDuplicates={true} />
}
```

### Max Tags Restriction

```tsx
import React from "react"

import { TagsInput } from "@repo/tags/tags-input"

function App() {
  return <TagsInput maxTags={5} />
}
```

## License

This component is licensed under the MIT License. See the `LICENSE` file for details.

```yaml
license: MIT
file: LICENSE
```
