import ProtectedSectionApp from "../ProtectedSectionApp";

export const dynamic = 'force-dynamic';

export default function InventoryPage() {
  return <ProtectedSectionApp initialTab="inventory" />;
}
