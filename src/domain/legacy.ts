import type { EntityId, ISODate, LegacyWeekday } from "./shared";

/**
 * Current localStorage shapes (Spanish keys).
 * Use only for migration and legacy component bridges — prefer English domain types.
 */

export type LegacyStudentRecord = {
  COD_CLI: EntityId;
  DNI?: string;
  NOMBRE: string;
  APELLIDOS: string;
  DIRECCION?: string;
  DIRECCION_PISO?: string;
  CP?: string;
  CIUDAD?: string;
  EMAIL?: string;
  TELEFONO?: string;
  ALUMNO?: string;
  EDAD?: number | string;
  FECHA_ALTA: ISODate;
  ESTADO: string;
  NOTAS?: string;
  tipoVia?: string;
  nombreVia?: string;
  numero?: string;
  portalAbrev?: string;
  portalNum?: string;
  pisoNum?: string;
  pisoLetra?: string;
  dniNumeros?: string;
  dniLetra?: string;
};

export type LegacyCourseRecord = {
  COD_PROD: EntityId;
  CURSO: string;
  CUOTA: number;
  TIPO: string;
  ESTADO: string;
  FECHA_CREACION: ISODate;
};

export type LegacyClassGroupRecord = {
  id: EntityId;
  nombre: string;
  idProducto: EntityId;
  dias: LegacyWeekday[];
  horaInicio: string;
  horaFin: string;
  color: string;
  fechaInicio?: ISODate;
  fechaFin?: ISODate;
  capacidad?: number | string;
  estado: string;
};

export type LegacyEnrollmentRecord = {
  id: EntityId;
  idCliente: EntityId;
  idGrupo: EntityId;
  fechaAlta: ISODate;
  estado: string;
  fechaBaja?: ISODate;
};

export type LegacyPaymentLineItem = {
  concepto: string;
  cantidad: number;
  precio: number;
};

export type LegacyPaymentRecord = {
  id: EntityId;
  fecha: ISODate;
  idCliente: EntityId;
  nombreCliente: string;
  lineas: LegacyPaymentLineItem[];
  total: number;
  estado: string;
  billingPeriod?: string;
  groupIds?: EntityId[];
  paymentMethod?: string;
  voidedAt?: string;
};

export type LegacyOrganizationSettings = {
  nombre: string;
  cif?: string;
  telefono?: string;
  email?: string;
  tipoVia?: string;
  direccion?: string;
  numero?: string;
  puerta?: string;
  cp?: string;
  ciudad?: string;
  provincia?: string;
};

export type LegacyFixedCosts = {
  autonomo: number;
  alquiler: number;
  otros: number;
};
