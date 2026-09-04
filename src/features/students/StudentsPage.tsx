import { useNavigation } from "../../app/navigation/useNavigation";
import { StudentsManager } from "./components/StudentsManager";

export function StudentsPage() {
  const { pendingAction } = useNavigation();
  return <StudentsManager openNewForm={pendingAction === "nuevo"} />;
}
