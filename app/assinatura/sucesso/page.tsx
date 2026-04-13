import SuccessStatusClient from "./SuccessStatusClient";

type BillingSuccessPageProps = {
  searchParams?: Promise<{
    session_id?: string | string[];
  }>;
};

function getSessionIdFromSearchParams(
  sessionId: string | string[] | undefined,
) {
  if (Array.isArray(sessionId)) {
    return sessionId[0];
  }

  return sessionId;
}

export default async function BillingSuccessPage({
  searchParams,
}: BillingSuccessPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionId = getSessionIdFromSearchParams(
    resolvedSearchParams?.session_id,
  );

  return <SuccessStatusClient sessionId={sessionId} />;
}
