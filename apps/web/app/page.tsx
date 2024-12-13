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
import { Command } from "@repo/ui/command"
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

function generateUniqueId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let uniqueId = ""
  for (let i = 0; i < 6; i++) {
    uniqueId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return uniqueId
}

const FormSchema = z.object({
  tags: z.array(
    z
      .string()
      .min(1, { message: "Each tag value must have at least 1 character." })
  ),
  items: z.array(
    z.object({
      id: z.string(),
      value: z
        .number()
        .min(0, { message: "Each value must have at least 1 character." }),
    })
  ),
})

export default function Home() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tags: ["daniel", "davies", "charis", "mitchell"],
      items: [],
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
    // form.reset()
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-2/3">
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
                          <TagsInputInput placeholder="Enter tags" />
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
                  <FormLabel>Items</FormLabel>
                  <FormControl>
                    <TagsInput
                      value={field.value}
                      onChange={field.onChange}
                      caseSensitiveDuplicates
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
                        <TagsInputInput placeholder="Enter tags" />
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
                        { id: generateUniqueId(), value: "new tag" },
                      ])
                    }
                  >
                    Add random tag
                  </Button>
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit">
              Submit
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
