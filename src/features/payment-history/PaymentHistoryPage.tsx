import { useNavigation } from "../../app/navigation/useNavigation";
import { PaymentHistoryManager } from "./components/PaymentHistoryManager";

export function PaymentHistoryPage() {
  const { pendingAction, navigationEpoch } = useNavigation();
  return (
    <PaymentHistoryManager
      key={`history-${navigationEpoch}`}
      initialStatusFilter={pendingAction === "morosos" ? "pending" : "all"}
    />
  );
}
