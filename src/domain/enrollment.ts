import type { ActiveStatus, EntityId, ISODate } from "./shared";

export type EnrollmentStatus = ActiveStatus;

/** Student membership in a class group. */
export type Enrollment = {
  enrollmentId: EntityId;
  studentId: EntityId;
  classGroupId: EntityId;
  enrolledAt: ISODate;
  status: EnrollmentStatus;
  withdrawnAt?: ISODate;
};

export type EnrollmentDraft = Omit<Enrollment, "enrollmentId"> & {
  enrollmentId?: EntityId;
};
