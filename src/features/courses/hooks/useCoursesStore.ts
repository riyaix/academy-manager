import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../../../app/store/appStore";

export function useCoursesStore() {
  return useAppStore(
    useShallow((state) => ({
      courses: state.courses,
      setCourses: state.setCourses,
      students: state.students,
      enrollments: state.enrollments,
      classGroups: state.classGroups,
    })),
  );
}
