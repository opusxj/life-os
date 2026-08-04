import { revalidatePath } from "next/cache"

/**
 * Every Apex surface reads the same ledger — one transaction moves an account
 * balance, a budget bar, the savings tile, the overview and the sidebar net.
 * The subtree is therefore the honest scope.
 *
 * Server data was already fresh (the shell reads cookies, so every page is
 * dynamic), but Next's client-side Router Cache would serve a stale sibling
 * after a mutation: add a transaction, navigate to Budgets, see pre-mutation
 * numbers until a hard reload. To a non-technical user that reads as the app
 * losing their data.
 */
export function revalidateApex() {
  revalidatePath("/apex", "layout")
}
