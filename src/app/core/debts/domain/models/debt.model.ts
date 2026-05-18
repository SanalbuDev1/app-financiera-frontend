/** Estado de una deuda */
export type DebtStatus = 'active' | 'paid_off' | 'defaulted';

/** Tipo de tasa de interés */
export type InterestRateType = 'monthly' | 'annual';

/** Tipo de pago */
export type PaymentType = 'regular' | 'extra';

/** Estrategia de pago extraordinario */
export type ExtraPaymentStrategy = 'reduce_installment' | 'reduce_term';

/** Estado de una cuota en el cronograma */
export type ScheduleItemStatus = 'pending' | 'paid' | 'partial' | 'overdue';

/** Modelo principal de deuda */
export interface Debt {
  id: string;
  userId: string;
  debtTypeId: string;
  debtTypeName: string;
  frequencyId: string;
  frequencyName: string;
  creditor: string;
  description: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  interestRateType: InterestRateType;
  totalInstallments: number;
  remainingInstallments: number;
  installmentAmount: number;
  startDate: string;        // 'YYYY-MM-DD'
  nextPaymentDate: string;  // 'YYYY-MM-DD'
  status: DebtStatus;
  notes?: string;
  createdAt: string;
  progressPercentage: number;
}

/** Ítem del cronograma de amortización */
export interface DebtScheduleItem {
  id: string;
  debtId: string;
  installmentNumber: number;
  dueDate: string;          // 'YYYY-MM-DD'
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  balanceAfter: number;
  status: ScheduleItemStatus;
  createdAt: string;
}

/** Pago registrado de una deuda */
export interface DebtPayment {
  id: string;
  debtId: string;
  paymentDate: string;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  paymentType: PaymentType;
  extraPaymentStrategy?: ExtraPaymentStrategy;
  notes?: string;
  createdAt: string;
}

/** Resumen global de deudas del usuario */
export interface DebtSummary {
  totalDebts: number;
  totalBalance: number;
  totalOriginalAmount: number;
  totalMonthlyPayment: number;
  totalPendingInterest: number;
  averageProgress: number;
}

/** Detalle completo de una deuda (con cronograma de amortización) */
export interface DebtDetail {
  debt: Debt;
  schedule: DebtScheduleItem[];
}

/** DTO para crear una nueva deuda */
export interface CreateDebtRequest {
  creditor: string;
  description: string;
  debtTypeId: string;
  frequencyId: string;
  originalAmount: number;
  interestRate: number;
  interestRateType: InterestRateType;
  totalInstallments: number;
  startDate: string;  // 'YYYY-MM-DD'
  notes?: string;
}

/** DTO para actualizar los datos editables de una deuda */
export interface UpdateDebtRequest {
  creditor: string;
  description: string;
  notes?: string;
}

/** DTO para registrar un pago */
export interface RegisterPaymentRequest {
  paymentDate?: string;                    // 'YYYY-MM-DD', default hoy
  totalAmount: number;                     // requerido aunque se ignore en pagos regular
  paymentType: PaymentType;
  extraPaymentStrategy?: ExtraPaymentStrategy;
  notes?: string;
}

/** Tipos de deuda disponibles (datos maestros hardcodeados en frontend) */
export const DEBT_TYPES: ReadonlyArray<{ id: string; name: string; icon: string }> = [
  { id: 'debt-type-credit-card', name: 'Tarjeta de crédito', icon: '💳' },
  { id: 'debt-type-bank-loan',   name: 'Préstamo bancario',  icon: '🏦' },
  { id: 'debt-type-vehicle',     name: 'Crédito vehículo',   icon: '🚗' },
  { id: 'debt-type-mortgage',    name: 'Hipoteca',           icon: '🏠' },
  { id: 'debt-type-informal',    name: 'Préstamo informal',  icon: '🤝' },
  { id: 'debt-type-other',       name: 'Otro',               icon: '📋' },
];

/** Frecuencias de pago disponibles */
export const DEBT_FREQUENCIES: ReadonlyArray<{ id: string; name: string }> = [
  { id: 'freq-monthly',  name: 'Mensual (30 días)' },
  { id: 'freq-biweekly', name: 'Quincenal (15 días)' },
];

/**
 * Obtiene el ícono de un tipo de deuda por su ID.
 * Retorna '📋' si no se encuentra el tipo.
 */
export function getDebtTypeIcon(debtTypeId: string): string {
  return DEBT_TYPES.find(t => t.id === debtTypeId)?.icon ?? '📋';
}

/**
 * Calcula la cuota mensual usando la fórmula francesa de amortización.
 * @param principal Monto original del préstamo (P)
 * @param rate Tasa de interés (porcentaje, ej: 2.5 para 2.5%)
 * @param rateType 'monthly' o 'annual'
 * @param n Número de cuotas
 */
export function calculateInstallment(
  principal: number,
  rate: number,
  rateType: InterestRateType,
  n: number,
): number {
  if (!principal || !n || principal <= 0 || n <= 0 || rate < 0) return 0;
  let r: number;
  if (rateType === 'monthly') {
    r = rate / 100;
  } else {
    r = Math.pow(1 + rate / 100, 1 / 12) - 1;
  }
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}
