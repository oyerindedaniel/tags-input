export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Tags Input",
  description:
    "flexible and customizable React component for inputting, managing, and displaying tags",
  url:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3005"
      : "http://localhost:3005",
  links: { github: "https://github.com/oyerindedaniel/tags-input" },
  author: { name: "Oyerinde Daniel", url: "http://localhost:3005" },
}
