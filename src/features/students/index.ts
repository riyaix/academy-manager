import { Users } from "lucide-react";
import type { FeatureModule } from "../../app/navigation/feature-module";
import { StudentsPage } from "./StudentsPage";

export const studentsFeature: FeatureModule = {
  id: "students",
  navItem: { icon: Users, labelKey: "nav.students", section: "academy" },
  routes: [
    {
      path: "students",
      component: StudentsPage,
      remountOnActions: ["nuevo"],
    },
  ],
};
