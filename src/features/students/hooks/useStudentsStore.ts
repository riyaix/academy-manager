import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../../../app/store/appStore";

export function useStudentsStore() {
  return useAppStore(
    useShallow((state) => ({
      students: state.students,
      setStudents: state.setStudents,
      enrollments: state.enrollments,
      classGroups: state.classGroups,
      courses: state.courses,
      taxIdSeparator: state.taxIdSeparator,
    })),
  );
}
