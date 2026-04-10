import type { DefaultSession } from "next-auth";

import type { UserPlan } from "@/lib/auth/profile-rules";

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
    };
  }

  interface User {
    id: string;
  }
}
