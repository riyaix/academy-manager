import { describe, expect, it } from "vitest";
import {
  classGroupToLegacyClassGroup,
  courseToLegacyCourse,
  enrollmentToLegacyEnrollment,
  fixedCostsToLegacyFixedCosts,
  legacyClassGroupToClassGroup,
  legacyCourseToCourse,
  legacyEnrollmentToEnrollment,
  legacyFixedCostsToFixedCosts,
  legacyPaymentRecordToPaymentRecord,
  legacyStudentToStudent,
  paymentRecordToLegacyPaymentRecord,
  studentToLegacyStudent,
} from "./legacy-mappers";
import type { ClassGroup } from "./group";
import type { Course } from "./course";
import type { Enrollment } from "./enrollment";
import { toMoney } from "./money";
import type { PaymentRecord } from "./payment-record";
import type { Student } from "./student";
import type { FixedCosts } from "./settings";
import type { LegacyClassGroupRecord } from "./legacy";

describe("legacyStudentToStudent / studentToLegacyStudent", () => {
  const legacy = {
    COD_CLI: "C001",
    DNI: "12345678A",
    NOMBRE: "Ana",
    APELLIDOS: "López",
    tipoVia: "C/",
    nombreVia: "Mayor",
    numero: "12",
    portalAbrev: "Pta.",
    portalNum: "3",
    pisoNum: "2",
    pisoLetra: "B",
    DIRECCION: "C/ Mayor, n.º 12",
    DIRECCION_PISO: "Pta. 3 Apt. 2 B",
    CP: "06001",
    CIUDAD: "Badajoz",
    EMAIL: "ana@example.com",
    TELEFONO: "600 12 34 56",
    ALUMNO: "Pedro López",
    EDAD: "10",
    FECHA_ALTA: "2025-01-01",
    ESTADO: "Activo",
    NOTAS: "Hermano en inglés",
  };

  it("maps legacy student fields to domain model", () => {
    const student = legacyStudentToStudent(legacy);
    expect(student.studentId).toBe("C001");
    expect(student.guardianTaxId).toBe("12345678A");
    expect(student.status).toBe("active");
    expect(student.studentName).toBe("Pedro López");
  });

  it("round-trips student data", () => {
    const student: Student = legacyStudentToStudent(legacy);
    const back = studentToLegacyStudent(student);
    expect(back).toEqual(legacy);
  });

  it("maps inactive legacy status", () => {
    expect(legacyStudentToStudent({ ...legacy, ESTADO: "Inactivo" }).status).toBe("inactive");
  });
});

describe("legacyCourseToCourse / courseToLegacyCourse", () => {
  it("maps billing types and round-trips", () => {
    const legacy = {
      COD_PROD: "P001",
      CURSO: "Inglés B2",
      CUOTA: 45,
      TIPO: "Mensual",
      ESTADO: "Activo",
      FECHA_CREACION: "2025-09-01",
    };
    const course: Course = legacyCourseToCourse(legacy);
    expect(course.billingType).toBe("monthly");
    expect(courseToLegacyCourse(course)).toEqual(legacy);
  });
});

describe("legacyClassGroupToClassGroup / classGroupToLegacyClassGroup", () => {
  it("maps archived group status", () => {
    const legacy = {
      id: "G001",
      nombre: "Tarde",
      idProducto: "P001",
      dias: ["Lunes"],
      horaInicio: "16:00",
      horaFin: "17:00",
      color: "bg-blue-500",
      estado: "Archivado",
    } satisfies LegacyClassGroupRecord;
    const group: ClassGroup = legacyClassGroupToClassGroup(legacy);
    expect(group.status).toBe("archived");
    expect(classGroupToLegacyClassGroup(group).estado).toBe("Archivado");
  });
});

describe("legacyEnrollmentToEnrollment / enrollmentToLegacyEnrollment", () => {
  it("maps enrollment status and dates", () => {
    const legacy = {
      id: "M001",
      idCliente: "C001",
      idGrupo: "G001",
      fechaAlta: "2025-09-01",
      estado: "Inactivo",
      fechaBaja: "2026-01-15",
    };
    const enrollment: Enrollment = legacyEnrollmentToEnrollment(legacy);
    expect(enrollment.status).toBe("inactive");
    expect(enrollment.withdrawnAt).toBe("2026-01-15");
    expect(enrollmentToLegacyEnrollment(enrollment)).toEqual(legacy);
  });
});

describe("legacyPaymentRecordToPaymentRecord / paymentRecordToLegacyPaymentRecord", () => {
  it("maps payment statuses including voided", () => {
    const legacy = {
      id: "F-2026-001",
      fecha: "2026-03-01",
      idCliente: "C001",
      nombreCliente: "Ana López",
      lineas: [{ concepto: "Cuota", cantidad: 1, precio: 45 }],
      total: 45,
      estado: "Anulada",
      billingPeriod: "Marzo 2026",
      paymentMethod: "Bizum",
      groupIds: ["G001"],
      voidedAt: "2026-03-05",
    };
    const record: PaymentRecord = legacyPaymentRecordToPaymentRecord(legacy);
    expect(record.status).toBe("voided");
    expect(record.lineItems[0].description).toBe("Cuota");
    expect(paymentRecordToLegacyPaymentRecord(record)).toEqual(legacy);
  });
});

describe("legacyFixedCostsToFixedCosts / fixedCostsToLegacyFixedCosts", () => {
  it("round-trips fixed costs", () => {
    const costs: FixedCosts = {
      selfEmployedFee: toMoney(300),
      rent: toMoney(650),
      other: toMoney(85),
    };
    expect(legacyFixedCostsToFixedCosts(fixedCostsToLegacyFixedCosts(costs))).toEqual(costs);
  });
});
