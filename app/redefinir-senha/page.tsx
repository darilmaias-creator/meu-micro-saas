import ResetPasswordForm from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[] | undefined;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawToken = resolvedSearchParams.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  return <ResetPasswordForm initialToken={token ?? ""} />;
}
