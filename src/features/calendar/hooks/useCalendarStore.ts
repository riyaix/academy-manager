import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../../../app/store/appStore";

export function useCalendarStore() {
  return useAppStore(
    useShallow((state) => ({
      classGroups: state.classGroups,
      enrollments: state.enrollments,
      courses: state.courses,
    })),
  );
}
