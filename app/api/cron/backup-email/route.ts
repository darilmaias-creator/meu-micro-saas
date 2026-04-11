import { NextResponse } from "next/server";

import { getBackupPayloadForUser } from "@/lib/account/backup";
import { isBackupDue } from "@/lib/account/backup-config";
import { sendBackupEmail } from "@/lib/account/backup-email";
import {
  findUsersWithAutomaticBackupEnabled,
  markUserBackupSent,
} from "@/lib/auth/user-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthorizedCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return true;
  }

  const authorizationHeader = request.headers.get("authorization");

  return authorizationHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await findUsersWithAutomaticBackupEnabled();
    const now = new Date();
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      const destinationEmail = user.backupEmail?.trim();

      if (!destinationEmail || !isBackupDue(user.backupFrequency, user.backupLastSentAt, now)) {
        skipped += 1;
        continue;
      }

      try {
        const payload = await getBackupPayloadForUser(user);

        await sendBackupEmail({
          to: destinationEmail,
          payload,
        });

        await markUserBackupSent(user.id, now.toISOString());
        sent += 1;
      } catch (error) {
        console.error("[cron:backup-email]", user.id, error);
        failed += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      checked: users.length,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("[cron:backup-email]", error);

    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
