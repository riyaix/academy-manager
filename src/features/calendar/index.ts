import { CalendarDays } from "lucide-react";
import type { FeatureModule } from "../../app/navigation/feature-module";
import { CalendarPage } from "./CalendarPage";

export const calendarFeature: FeatureModule = {
  id: "calendar",
  navItem: { icon: CalendarDays, labelKey: "nav.calendar", section: "academy" },
  routes: [
    {
      path: "calendar",
      component: CalendarPage,
      remountOnActions: ["semana"],
    },
  ],
};
