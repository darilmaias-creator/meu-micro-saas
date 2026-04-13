import { redirect } from "next/navigation";

export default function InventoryPage() {
  redirect("/?tab=estoque");
}
