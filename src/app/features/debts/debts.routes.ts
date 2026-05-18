import { Routes } from '@angular/router';
import { DebtsShellComponent } from './debts-shell.component';
import { DebtListComponent } from './debt-list/debt-list.component';
import { DebtDetailComponent } from './debt-detail/debt-detail.component';
import { ListDebtsUseCase } from '../../core/debts/application/use-cases/list-debts.use-case';
import { GetDebtSummaryUseCase } from '../../core/debts/application/use-cases/get-debt-summary.use-case';
import { GetDebtDetailUseCase } from '../../core/debts/application/use-cases/get-debt-detail.use-case';
import { CreateDebtUseCase } from '../../core/debts/application/use-cases/create-debt.use-case';
import { UpdateDebtUseCase } from '../../core/debts/application/use-cases/update-debt.use-case';
import { DeleteDebtUseCase } from '../../core/debts/application/use-cases/delete-debt.use-case';
import { RegisterPaymentUseCase } from '../../core/debts/application/use-cases/register-payment.use-case';

/** Rutas del módulo de deudas */
export const debtsRoutes: Routes = [
  {
    path: '',
    component: DebtsShellComponent,
    providers: [
      ListDebtsUseCase,
      GetDebtSummaryUseCase,
      GetDebtDetailUseCase,
      CreateDebtUseCase,
      UpdateDebtUseCase,
      DeleteDebtUseCase,
      RegisterPaymentUseCase,
    ],
    children: [
      { path: '',    component: DebtListComponent },
      { path: ':id', component: DebtDetailComponent },
    ],
  },
];
