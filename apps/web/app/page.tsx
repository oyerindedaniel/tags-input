"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemGroup,
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
  tags: z.array(
    z.object({
      id: z.string({ message: "Each tag must have an id." }),
      value: z
        .string()
        .min(2, { message: "Each tag value must be at least 2 characters." }),
    })
  ),
})

type tags = z.infer<typeof FormSchema>

export default function Home() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tags: [],
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
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-2/3 space-y-6"
        >
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagsInput value={field.value} onChange={field.onChange}>
                    <TagsInputItemGroup>
                      {field.value.map((tag, idx) => (
                        <TagsInputItem keyIndex={idx}>
                          <TagsInputItemText>
                            <span>{tag.value}</span>
                            <TagsInputItemDelete />
                          </TagsInputItemText>
                        </TagsInputItem>
                      ))}
                    </TagsInputItemGroup>
                    <TagsInputInput placeholder="Enter tags" />
                  </TagsInput>
                </FormControl>
                <FormDescription>These are your tags</FormDescription>
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
