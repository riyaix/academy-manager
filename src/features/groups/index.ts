import { BookOpen } from "lucide-react";
import type { FeatureModule } from "../../app/navigation/feature-module";
import { GroupsPage } from "./GroupsPage";

export const groupsFeature: FeatureModule = {
  id: "groups",
  navItem: { icon: BookOpen, labelKey: "nav.groups", section: "academy" },
  routes: [
    {
      path: "groups",
      component: GroupsPage,
      remountOnActions: ["nuevo"],
    },
  ],
};
