# Life OS

A personal operating system for everyday life.

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (base-nova style, Base UI) — full component set installed in `components/ui`

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run format     # prettier
```

## Notes

- Dark mode: press <kbd>d</kbd> anywhere to toggle (see `components/theme-provider.tsx`).
- UI components live in `components/ui` and are imported as `@/components/ui/<name>`.
