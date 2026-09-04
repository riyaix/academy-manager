import { useNavigation } from "../../app/navigation/useNavigation";
import { CalendarView } from "./components/CalendarView";

export function CalendarPage() {
  const { pendingAction, navigationEpoch } = useNavigation();
  return (
    <CalendarView
      key={`calendar-${navigationEpoch}`}
      initialView={pendingAction === "semana" ? "semanal" : "semanal"}
    />
  );
}
