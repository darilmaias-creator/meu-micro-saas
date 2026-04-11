import type { DefaultSession } from "next-auth";

import type { UserPlan } from "@/lib/auth/profile-rules";
import type { BackupFrequency } from "@/lib/account/backup-config";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      plan: UserPlan;
      isPremium: boolean;
      canChangeName: boolean;
      canChangePhoto: boolean;
      freeNameChangesUsed: number;
      freeNameChangesRemaining: number;
      backupEmail?: string | null;
      backupFrequency: BackupFrequency;
      backupLastSentAt?: string | null;
    };
  }

  interface User {
    id: string;
  }
}
