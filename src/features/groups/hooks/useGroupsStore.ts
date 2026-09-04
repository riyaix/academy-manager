import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../../../app/store/appStore";

export function useGroupsStore() {
  return useAppStore(
    useShallow((state) => ({
      students: state.students,
      courses: state.courses,
      classGroups: state.classGroups,
      setClassGroups: state.setClassGroups,
      enrollments: state.enrollments,
      setEnrollments: state.setEnrollments,
    })),
  );
}
