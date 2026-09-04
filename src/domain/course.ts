import type { Money } from "./money";
import type { ActiveStatus, EntityId, ISODate } from "./shared";

export type CourseBillingType = "monthly" | "one_time" | "custom";

export type Course = {
  courseId: EntityId;
  courseName: string;
  monthlyFee: Money;
  billingType: CourseBillingType;
  status: ActiveStatus;
  createdAt: ISODate;
};

export type CourseDraft = Omit<Course, "courseId"> & {
  courseId?: EntityId;
};
