import { useNavigation } from "../../app/navigation/useNavigation";
import { BillingForm } from "./components/BillingForm";

export function BillingPage() {
  const { pendingAction, navigationEpoch } = useNavigation();
  const initialMode = pendingAction === "manual" ? "manual" : "lote";
  return <BillingForm key={`billing-${navigationEpoch}`} initialModo={initialMode} />;
}
