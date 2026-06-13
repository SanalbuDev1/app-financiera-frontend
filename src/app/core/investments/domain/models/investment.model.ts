/** Tipos de producto de inversión soportados por el backend */
export type InvestmentProductType = 'ahorro' | 'inversion';

/** Frecuencia de capitalización para productos con interés compuesto */
export type InvestmentCompoundingFrequency = 'monthly' | 'quarterly' | 'yearly';

/** Estado de una inversión */
export type InvestmentStatus = 'active' | 'closed';

/** Tipo de aporte sobre una inversión */
export type InvestmentContributionType = 'regular' | 'extra';

/** Entidad principal de inversión */
export interface Investment {
  id: string;
  name: string;
  productType: InvestmentProductType;
  compoundingFrequency: InvestmentCompoundingFrequency;
  initialAmount: number;
  currentAmount: number;
  annualRate: number;
  startDate: string;
  targetDate: string;
  status: InvestmentStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Aporte realizado sobre una inversión */
export interface InvestmentContribution {
  id: string;
  investmentId: string;
  contributionDate: string;
  amount: number;
  contributionType: InvestmentContributionType;
  notes?: string;
  createdAt?: string;
}

/** Resumen agregado del módulo de inversiones */
export interface InvestmentsSummary {
  totalInvestments: number;
  activeInvestments: number;
  closedInvestments: number;
  totalInitialAmount: number;
  totalCurrentAmount: number;
  totalContributions: number;
  totalProjectedGain: number;
}

/** Resultado de la proyección de una inversión */
export interface InvestmentProjection {
  investmentId: string;
  projectedAmount: number;
  projectedGain: number;
  projectedAtTargetDate: string;
  monthsToTarget: number;
  annualRate: number;
}

/** DTO de creación de inversión */
export interface CreateInvestmentRequest {
  name: string;
  productType: InvestmentProductType;
  compoundingFrequency: InvestmentCompoundingFrequency;
  initialAmount: number;
  annualRate: number;
  startDate: string;
  targetDate: string;
  notes?: string;
}

/** DTO de actualización de inversión */
export interface UpdateInvestmentRequest {
  name: string;
  compoundingFrequency: InvestmentCompoundingFrequency;
  annualRate: number;
  targetDate: string;
  status: InvestmentStatus;
  notes?: string;
}

/** DTO de registro de aporte */
export interface RegisterInvestmentContributionRequest {
  contributionDate: string;
  amount: number;
  contributionType: InvestmentContributionType;
  notes?: string;
}
