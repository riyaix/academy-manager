import type { ActiveStatus, EntityId, ISODate, LegacyWeekday } from "./shared";

export type ClassGroupStatus = ActiveStatus | "archived";

/** Scheduled class group linked to a course. */
export type ClassGroup = {
  classGroupId: EntityId;
  name: string;
  courseId: EntityId;
  weekdays: LegacyWeekday[];
  startTime: string;
  endTime: string;
  colorClass: string;
  startDate?: ISODate;
  endDate?: ISODate;
  capacity?: number;
  status: ClassGroupStatus;
};

export type ClassGroupDraft = Omit<ClassGroup, "classGroupId"> & {
  classGroupId?: EntityId;
};
