export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Tags Input",
  description:
    "flexible and customizable react component for inputting, managing, and displaying tags",
  url:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3005"
      : "https://tags-input-web.vercel.app",
  links: { github: "https://github.com/oyerindedaniel/tags-input" },
  author: { name: "Oyerinde Daniel", url: "https://tags-input-web.vercel.app" },
}
