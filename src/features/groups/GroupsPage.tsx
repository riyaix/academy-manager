import { useNavigation } from "../../app/navigation/useNavigation";
import { GroupsManager } from "./components/GroupsManager";

export function GroupsPage() {
  const { pendingAction } = useNavigation();
  return <GroupsManager openNewGroupForm={pendingAction === "nuevo"} />;
}
