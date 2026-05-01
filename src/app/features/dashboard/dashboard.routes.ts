import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { ListTransactionsUseCase } from '../../core/finances/application/use-cases/list-transactions.use-case';
import { CreateTransactionUseCase } from '../../core/finances/application/use-cases/create-transaction.use-case';
import { UpdateTransactionUseCase } from '../../core/finances/application/use-cases/update-transaction.use-case';
import { DeleteTransactionUseCase } from '../../core/finances/application/use-cases/delete-transaction.use-case';
import { GetSummaryUseCase } from '../../core/finances/application/use-cases/get-summary.use-case';

/** Rutas del módulo de dashboard */
export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    providers: [
      ListTransactionsUseCase,
      CreateTransactionUseCase,
      UpdateTransactionUseCase,
      DeleteTransactionUseCase,
      GetSummaryUseCase,
    ],
  },
];
