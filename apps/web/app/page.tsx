"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useDisclosure } from "@repo/hooks/use-disclosure"
import { useIsMounted } from "@repo/hooks/use-is-mounted"
import {
  Delimiters,
  TagsInput,
  TagsInputGroup,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputKeyActions,
} from "@repo/tags/tags-input"
import { Button } from "@repo/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/command"
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

import { cn } from "../lib/utils"

function generateRandomWord(length = 5) {
  const characters = "abcdefghijklmnopqrstuvwxyz"
  let word = ""

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    word += characters[randomIndex]
  }

  return word
}

function generateUniqueId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let uniqueId = ""
  for (let i = 0; i < 6; i++) {
    uniqueId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return uniqueId
}

const FormSchema = z.object({
  tags: z
    .array(
      z.string({
        message: "Tags must be strings.",
      })
    )
    .min(1, { message: "You must enter at least one tag." })
    .refine((tags) => tags.every((tag) => isNaN(Number(tag))), {
      message: "Tags must be strings, not numbers.",
    }),
  items: z.array(
    z.object({
      id: z.string(),
      value: z.string(),
    })
  ),
  values: z
    .array(z.string())
    .min(1, { message: "You must enter at least one value." }),
})

const randomTags = [
  { label: "Cool", value: "cool" },
  { label: "Awesome", value: "awesome" },
  { label: "Innovative", value: "innovative" },
  { label: "Trendy", value: "trendy" },
  { label: "Modern", value: "modern" },
  { label: "Creative", value: "creative" },
  { label: "Unique", value: "unique" },
  { label: "Exciting", value: "exciting" },
  { label: "Fun", value: "fun" },
  { label: "Sleek", value: "sleek" },
]

export default function Home() {
  const { isOpen, onOpen, onClose, toggle } = useDisclosure()
  const isMounted = useIsMounted()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tags: ["daniel", "davies", "charis", "mitchell"],
      items: [],
      values: [],
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast({
      title: "You submitted the following tags:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
    form.reset()
  }

  if (!isMounted) return

  return (
    <div className="h-full">
      <h1 className="mb-5 text-xl font-semibold text-primary underline">
        Tags Input
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagsInput
                      value={field.value}
                      onChange={field.onChange}
                      caseSensitiveDuplicates
                    >
                      <TagsInputGroup>
                        {field.value.map((tag, idx) => (
                          <TagsInputItem size="sm" key={idx}>
                            <TagsInputItemText>{tag}</TagsInputItemText>
                            <TagsInputItemDelete />
                          </TagsInputItem>
                        ))}
                        <TagsInputInput
                          placeholder="Enter tags"
                          ref={field.ref}
                        />
                      </TagsInputGroup>
                    </TagsInput>
                  </FormControl>
                  <FormDescription>These are your tags</FormDescription>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name="items"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Items{" "}
                  <span className="font-bold text-primary">
                    (with object example)
                  </span>
                </FormLabel>
                <FormControl>
                  <TagsInput
                    value={field.value}
                    onChange={field.onChange}
                    parseInput={(tag) => ({
                      value: tag,
                      id: generateUniqueId(),
                    })}
                  >
                    <TagsInputGroup>
                      {field.value.map((tag, idx) => (
                        <TagsInputItem key={idx}>
                          <TagsInputItemText>{tag.value}</TagsInputItemText>
                          <TagsInputItemDelete />
                        </TagsInputItem>
                      ))}
                      <TagsInputInput
                        placeholder="Enter tags"
                        ref={field.ref}
                      />
                    </TagsInputGroup>
                  </TagsInput>
                </FormControl>
                <FormDescription>These are your tags</FormDescription>
                <FormMessage />
                <Button
                  type="button"
                  onClick={() =>
                    field.onChange([
                      ...field.value,
                      { id: generateUniqueId(), value: generateRandomWord() },
                    ])
                  }
                >
                  Add random tag
                </Button>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="values"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  Values{" "}
                  <span className="font-bold text-primary">
                    (command example)
                  </span>
                </FormLabel>
                <TagsInput value={field.value} onChange={field.onChange}>
                  <TagsInputGroup>
                    {field.value.map((tag, idx) => (
                      <TagsInputItem key={idx}>
                        <TagsInputItemText>{tag}</TagsInputItemText>
                        <TagsInputItemDelete />
                      </TagsInputItem>
                    ))}
                  </TagsInputGroup>
                  <Command className="border border-secondary">
                    <FormControl>
                      <CommandInput asChild className="h-9">
                        <TagsInputInput
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                            }
                          }}
                          onPaste={(e) => e.preventDefault()}
                          placeholder="Search tags..."
                          ref={field.ref}
                        />
                      </CommandInput>
                    </FormControl>

                    {/* <CommandDialog open={isOpen} onOpenChange={onClose}> */}
                    <CommandList>
                      <CommandEmpty>No tag found.</CommandEmpty>
                      <CommandGroup>
                        {randomTags
                          .filter((tag) => !field.value.includes(tag.value))
                          .map((tag) => (
                            <CommandItem
                              value={tag.label}
                              key={tag.value}
                              onSelect={() => {
                                field.onChange([...field.value, tag.value])
                              }}
                            >
                              {tag.label}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  (field?.value ?? []).includes(tag.value)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                    {/* </CommandDialog> */}
                  </Command>
                </TagsInput>
                <FormDescription>
                  Select from the list of given tags
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-full" type="submit">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  )
}
