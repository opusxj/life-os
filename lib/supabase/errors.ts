/**
 * One voice for database failures, shared by every actions file (Apex and
 * spaces alike). Plain utility, deliberately not "use server".
 */
export function friendlyDbError(message?: string): string {
  if (!message) return "Something went wrong. Try again."
  // Strip Postgres error prefixes, keep our own raised messages readable
  return message.replace(/^.*?exception:\s*/i, "")
}
