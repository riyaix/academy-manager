import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../../../app/store/appStore";

export function useBillingStore() {
  return useAppStore(
    useShallow((state) => ({
      students: state.students,
      courses: state.courses,
      paymentRecords: state.paymentRecords,
      setPaymentRecords: state.setPaymentRecords,
      classGroups: state.classGroups,
      enrollments: state.enrollments,
      organization: state.organization,
      paymentRecordSeq: state.paymentRecordSeq,
      setPaymentRecordSeq: state.setPaymentRecordSeq,
      paymentMethods: state.paymentMethods,
    })),
  );
}
