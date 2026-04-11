export type BackupFrequency = "off" | "daily" | "weekly" | "monthly";

export const BACKUP_FREQUENCIES: BackupFrequency[] = [
  "off",
  "daily",
  "weekly",
  "monthly",
];

export function isValidBackupFrequency(value: unknown): value is BackupFrequency {
  return typeof value === "string" && BACKUP_FREQUENCIES.includes(value as BackupFrequency);
}

export function normalizeBackupFrequency(value: unknown): BackupFrequency {
  return isValidBackupFrequency(value) ? value : "off";
}

export function getNextBackupDate(
  frequency: BackupFrequency,
  lastSentAt: string | null | undefined,
) {
  if (frequency === "off") {
    return null;
  }

  if (!lastSentAt) {
    return new Date(0);
  }

  const nextDate = new Date(lastSentAt);

  if (Number.isNaN(nextDate.getTime())) {
    return new Date(0);
  }

  if (frequency === "daily") {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    return nextDate;
  }

  if (frequency === "weekly") {
    nextDate.setUTCDate(nextDate.getUTCDate() + 7);
    return nextDate;
  }

  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  return nextDate;
}

export function isBackupDue(
  frequency: BackupFrequency,
  lastSentAt: string | null | undefined,
  now = new Date(),
) {
  const nextBackupDate = getNextBackupDate(frequency, lastSentAt);

  if (!nextBackupDate) {
    return false;
  }

  return now >= nextBackupDate;
}
