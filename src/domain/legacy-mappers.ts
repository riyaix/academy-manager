import type { Student, StudentStatus } from "./student";
import type { Course, CourseBillingType } from "./course";
import type { ClassGroup, ClassGroupStatus } from "./group";
import type { Enrollment, EnrollmentStatus } from "./enrollment";
import type { PaymentRecord, PaymentRecordStatus } from "./payment-record";
import { fromMoney, toMoney } from "./money";
import type {
  LegacyClassGroupRecord,
  LegacyCourseRecord,
  LegacyEnrollmentRecord,
  LegacyFixedCosts,
  LegacyPaymentLineItem,
  LegacyPaymentRecord,
  LegacyStudentRecord,
} from "./legacy";
import type { FixedCosts } from "./settings";

const LEGACY_ACTIVE = "Activo";
const LEGACY_INACTIVE = "Inactivo";
const LEGACY_ARCHIVED = "Archivado";

function mapLegacyActiveStatus(value: string): StudentStatus {
  return value === LEGACY_ACTIVE ? "active" : "inactive";
}

function mapLegacyGroupStatus(value: string): ClassGroupStatus {
  if (value === LEGACY_ARCHIVED) return "archived";
  return value === LEGACY_ACTIVE ? "active" : "inactive";
}

function mapLegacyPaymentStatus(value: string): PaymentRecordStatus {
  if (value === "Pagada") return "paid";
  if (value === "Anulada") return "voided";
  return "pending";
}

function mapPaymentStatusToLegacy(status: PaymentRecordStatus): string {
  if (status === "paid") return "Pagada";
  if (status === "voided") return "Anulada";
  return "Pendiente";
}

function mapCourseBillingType(value: string): CourseBillingType {
  const normalized = value.toLowerCase();
  if (normalized === "mensual" || normalized === "monthly") return "monthly";
  if (normalized === "unico" || normalized === "one_time") return "one_time";
  return "custom";
}

export function legacyStudentToStudent(record: LegacyStudentRecord): Student {
  return {
    studentId: record.COD_CLI,
    guardianTaxId: record.DNI,
    guardianFirstName: record.NOMBRE,
    guardianLastName: record.APELLIDOS,
    streetType: record.tipoVia,
    streetName: record.nombreVia,
    streetNumber: record.numero,
    unitAbbreviation: record.portalAbrev,
    unitNumber: record.portalNum,
    floorNumber: record.pisoNum,
    floorLetter: record.pisoLetra,
    formattedAddress: record.DIRECCION,
    formattedUnit: record.DIRECCION_PISO,
    postalCode: record.CP,
    city: record.CIUDAD,
    email: record.EMAIL,
    phone: record.TELEFONO,
    studentName: record.ALUMNO,
    age: record.EDAD,
    enrolledAt: record.FECHA_ALTA,
    status: mapLegacyActiveStatus(record.ESTADO),
    notes: record.NOTAS,
  };
}

export function studentToLegacyStudent(student: Student): LegacyStudentRecord {
  return {
    COD_CLI: student.studentId,
    DNI: student.guardianTaxId,
    NOMBRE: student.guardianFirstName,
    APELLIDOS: student.guardianLastName,
    tipoVia: student.streetType,
    nombreVia: student.streetName,
    numero: student.streetNumber,
    portalAbrev: student.unitAbbreviation,
    portalNum: student.unitNumber,
    pisoNum: student.floorNumber,
    pisoLetra: student.floorLetter,
    DIRECCION: student.formattedAddress,
    DIRECCION_PISO: student.formattedUnit,
    CP: student.postalCode,
    CIUDAD: student.city,
    EMAIL: student.email,
    TELEFONO: student.phone,
    ALUMNO: student.studentName,
    EDAD: student.age,
    FECHA_ALTA: student.enrolledAt,
    ESTADO: student.status === "active" ? LEGACY_ACTIVE : LEGACY_INACTIVE,
    NOTAS: student.notes,
  };
}

export function legacyCourseToCourse(record: LegacyCourseRecord): Course {
  return {
    courseId: record.COD_PROD,
    courseName: record.CURSO,
    monthlyFee: toMoney(record.CUOTA),
    billingType: mapCourseBillingType(record.TIPO),
    status: mapLegacyActiveStatus(record.ESTADO),
    createdAt: record.FECHA_CREACION,
  };
}

export function legacyClassGroupToClassGroup(record: LegacyClassGroupRecord): ClassGroup {
  return {
    classGroupId: record.id,
    name: record.nombre,
    courseId: record.idProducto,
    weekdays: record.dias,
    startTime: record.horaInicio,
    endTime: record.horaFin,
    colorClass: record.color,
    startDate: record.fechaInicio,
    endDate: record.fechaFin,
    capacity: record.capacidad ? Number(record.capacidad) : undefined,
    status: mapLegacyGroupStatus(record.estado),
  };
}

export function legacyEnrollmentToEnrollment(record: LegacyEnrollmentRecord): Enrollment {
  const status: EnrollmentStatus = record.estado === LEGACY_ACTIVE ? "active" : "inactive";
  return {
    enrollmentId: record.id,
    studentId: record.idCliente,
    classGroupId: record.idGrupo,
    enrolledAt: record.fechaAlta,
    status,
    withdrawnAt: record.fechaBaja,
  };
}

function legacyLineToDomain(line: LegacyPaymentLineItem) {
  return {
    description: line.concepto,
    quantity: line.cantidad,
    unitPrice: toMoney(line.precio),
  };
}

function domainLineToLegacy(line: PaymentRecord["lineItems"][number]): LegacyPaymentLineItem {
  return {
    concepto: line.description,
    cantidad: line.quantity,
    precio: fromMoney(line.unitPrice),
  };
}

export function legacyPaymentRecordToPaymentRecord(record: LegacyPaymentRecord): PaymentRecord {
  return {
    recordId: record.id,
    issuedOn: record.fecha,
    studentId: record.idCliente,
    payerName: record.nombreCliente,
    lineItems: record.lineas.map(legacyLineToDomain),
    total: toMoney(record.total),
    status: mapLegacyPaymentStatus(record.estado),
    billingPeriod: record.billingPeriod,
    paymentMethod: record.paymentMethod,
    groupIds: record.groupIds,
    voidedAt: record.voidedAt,
  };
}

export function paymentRecordToLegacyPaymentRecord(record: PaymentRecord): LegacyPaymentRecord {
  return {
    id: record.recordId,
    fecha: record.issuedOn,
    idCliente: record.studentId,
    nombreCliente: record.payerName,
    lineas: record.lineItems.map(domainLineToLegacy),
    total: fromMoney(record.total),
    estado: mapPaymentStatusToLegacy(record.status),
    billingPeriod: record.billingPeriod,
    paymentMethod: record.paymentMethod,
    groupIds: record.groupIds,
    voidedAt: record.voidedAt,
  };
}

function mapCourseBillingTypeToLegacy(value: CourseBillingType): string {
  if (value === "monthly") return "Mensual";
  if (value === "one_time") return "Unico";
  return "Personalizado";
}

function mapLegacyGroupStatusToLegacy(value: ClassGroupStatus): string {
  if (value === "archived") return LEGACY_ARCHIVED;
  return value === "active" ? LEGACY_ACTIVE : LEGACY_INACTIVE;
}

export function courseToLegacyCourse(course: Course): LegacyCourseRecord {
  return {
    COD_PROD: course.courseId,
    CURSO: course.courseName,
    CUOTA: fromMoney(course.monthlyFee),
    TIPO: mapCourseBillingTypeToLegacy(course.billingType),
    ESTADO: course.status === "active" ? LEGACY_ACTIVE : LEGACY_INACTIVE,
    FECHA_CREACION: course.createdAt,
  };
}

export function classGroupToLegacyClassGroup(group: ClassGroup): LegacyClassGroupRecord {
  return {
    id: group.classGroupId,
    nombre: group.name,
    idProducto: group.courseId,
    dias: group.weekdays,
    horaInicio: group.startTime,
    horaFin: group.endTime,
    color: group.colorClass,
    fechaInicio: group.startDate,
    fechaFin: group.endDate,
    capacidad: group.capacity,
    estado: mapLegacyGroupStatusToLegacy(group.status),
  };
}

export function enrollmentToLegacyEnrollment(enrollment: Enrollment): LegacyEnrollmentRecord {
  return {
    id: enrollment.enrollmentId,
    idCliente: enrollment.studentId,
    idGrupo: enrollment.classGroupId,
    fechaAlta: enrollment.enrolledAt,
    estado: enrollment.status === "active" ? LEGACY_ACTIVE : LEGACY_INACTIVE,
    fechaBaja: enrollment.withdrawnAt,
  };
}

export function legacyFixedCostsToFixedCosts(costs: LegacyFixedCosts): FixedCosts {
  return {
    selfEmployedFee: toMoney(costs.autonomo),
    rent: toMoney(costs.alquiler),
    other: toMoney(costs.otros),
  };
}

export function fixedCostsToLegacyFixedCosts(costs: FixedCosts): LegacyFixedCosts {
  return {
    autonomo: fromMoney(costs.selfEmployedFee),
    alquiler: fromMoney(costs.rent),
    otros: fromMoney(costs.other),
  };
}
