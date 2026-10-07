import removals from "@/data/removed_demo_content.json";

type Group = keyof typeof removals;

/** Keep reviewed removals out of local admin even if a legacy sync restores seeds. */
export function withoutRemovedContent<T extends { id: string }>(group: Group, records: T[]): T[] {
  const removedIds = new Set(removals[group].map(record => record.id));
  return records.filter(record => !removedIds.has(record.id));
}
