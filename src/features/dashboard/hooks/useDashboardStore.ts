import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../../../app/store/appStore";

export function useDashboardStore() {
  return useAppStore(
    useShallow((state) => ({
      students: state.students,
      classGroups: state.classGroups,
      enrollments: state.enrollments,
      courses: state.courses,
      paymentRecords: state.paymentRecords,
      currencySymbol: state.currencySymbol,
    })),
  );
}
