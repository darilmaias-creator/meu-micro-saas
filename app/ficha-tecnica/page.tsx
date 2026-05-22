import ProtectedSectionApp from "../ProtectedSectionApp";

export const dynamic = 'force-dynamic';

export default function CalculatorPage() {
  return <ProtectedSectionApp initialTab="calculator" />;
}
