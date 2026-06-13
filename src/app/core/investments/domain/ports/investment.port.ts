import { Observable } from 'rxjs';
import {
  Investment,
  InvestmentsSummary,
  InvestmentProjection,
  InvestmentContribution,
  CreateInvestmentRequest,
  UpdateInvestmentRequest,
  RegisterInvestmentContributionRequest,
  InvestmentProductType,
  InvestmentStatus,
} from '../models/investment.model';

/** Parámetros de consulta para listado de inversiones paginado */
export interface InvestmentFilter {
  page?: number;
  size?: number;
  productType?: InvestmentProductType;
  status?: InvestmentStatus;
}

/** Respuesta paginada estándar del backend */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/** Puerto del dominio de inversiones */
export interface InvestmentPort {
  /** Obtiene inversiones paginadas con filtros opcionales */
  getAll(filter: InvestmentFilter): Observable<PaginatedResponse<Investment>>;

  /** Obtiene todas las inversiones sin paginación */
  getAllNoPagination(): Observable<Investment[]>;

  /** Obtiene una inversión por ID */
  getById(id: string): Observable<Investment>;

  /** Crea una inversión */
  create(req: CreateInvestmentRequest): Observable<Investment>;

  /** Actualiza una inversión existente */
  update(id: string, req: UpdateInvestmentRequest): Observable<Investment>;

  /** Elimina una inversión */
  delete(id: string): Observable<void>;

  /** Registra un aporte a una inversión */
  registerContribution(id: string, req: RegisterInvestmentContributionRequest): Observable<InvestmentContribution>;

  /** Lista los aportes de una inversión */
  getContributions(id: string): Observable<InvestmentContribution[]>;

  /** Obtiene la proyección de una inversión */
  getProjection(id: string): Observable<InvestmentProjection>;

  /** Obtiene el resumen agregado de inversiones */
  getSummary(): Observable<InvestmentsSummary>;
}
