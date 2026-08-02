export type Space = {
  id: string
  name: string
  initial: string
  /** Tailwind background class used for the space avatar */
  color: string
}

export type Member = {
  id: string
  name: string
  email: string
  initials: string
  online?: boolean
  isCurrentUser?: boolean
}

export const spaces: Space[] = [
  { id: "family", name: "Family Space", initial: "F", color: "bg-violet-600" },
  { id: "john", name: "John's Space", initial: "J", color: "bg-emerald-600" },
]

export const members: Member[] = [
  {
    id: "john",
    name: "John",
    email: "opusxj@gmail.com",
    initials: "J",
    online: true,
    isCurrentUser: true,
  },
]

// NOTE: mock data — remaining consumers (Home sidebar sections, space
// switcher) are replaced by live data in LIFE-20 and LIFE-24.
