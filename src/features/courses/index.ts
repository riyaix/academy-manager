import { GraduationCap } from "lucide-react";
import type { FeatureModule } from "../../app/navigation/feature-module";
import { CoursesPage } from "./CoursesPage";

export const coursesFeature: FeatureModule = {
  id: "courses",
  navItem: { icon: GraduationCap, labelKey: "nav.courses", section: "academy" },
  routes: [{ path: "courses", component: CoursesPage }],
};
