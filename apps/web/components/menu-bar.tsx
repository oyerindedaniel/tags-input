"use client"

import * as React from "react"
import { siteConfig } from "@/config/site"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@repo/ui/button"

export default function MenuBar() {
  const { setTheme, resolvedTheme } = useTheme()

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "light" ? "dark" : "light")
  }, [setTheme, resolvedTheme])

  return (
    <div className="sticky right-0 top-8 ml-auto w-fit bg-background">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-github"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
        </Button>
        <Button
          className="overflow-hidden transition-colors duration-300"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
        >
          <Sun className="hidden text-yellow-500 dark:block" aria-hidden />
          <Moon className="block text-gray-500 dark:hidden" aria-hidden />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  )
}
