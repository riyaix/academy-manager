import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../../../app/store/appStore";

export function usePaymentHistoryStore() {
  return useAppStore(
    useShallow((state) => ({
      paymentRecords: state.paymentRecords,
      setPaymentRecords: state.setPaymentRecords,
      students: state.students,
      organization: state.organization,
      taxMode: state.taxMode,
      defaultVatRate: state.defaultVatRate,
      defaultIncomeTaxReserveRate: state.defaultIncomeTaxReserveRate,
      currencySymbol: state.currencySymbol,
      brandColor: state.brandColor,
      logoDataUrl: state.logoDataUrl,
      paymentMethods: state.paymentMethods,
    })),
  );
}
