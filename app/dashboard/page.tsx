import ProtectedSectionApp from "../ProtectedSectionApp";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <ProtectedSectionApp initialTab="dashboard" />;
}
