import { Routes } from '@angular/router';
import { InvestmentsShellComponent } from './investments-shell.component';
import { InvestmentListComponent } from './investment-list/investment-list.component';
import { InvestmentDetailComponent } from './investment-detail/investment-detail.component';
import { ListInvestmentsUseCase } from '../../core/investments/application/use-cases/list-investments.use-case';
import { GetInvestmentUseCase } from '../../core/investments/application/use-cases/get-investment.use-case';
import { CreateInvestmentUseCase } from '../../core/investments/application/use-cases/create-investment.use-case';
import { UpdateInvestmentUseCase } from '../../core/investments/application/use-cases/update-investment.use-case';
import { DeleteInvestmentUseCase } from '../../core/investments/application/use-cases/delete-investment.use-case';
import { RegisterInvestmentContributionUseCase } from '../../core/investments/application/use-cases/register-investment-contribution.use-case';
import { ListInvestmentContributionsUseCase } from '../../core/investments/application/use-cases/list-investment-contributions.use-case';
import { GetInvestmentProjectionUseCase } from '../../core/investments/application/use-cases/get-investment-projection.use-case';
import { GetInvestmentsSummaryUseCase } from '../../core/investments/application/use-cases/get-investments-summary.use-case';

/** Rutas del módulo de inversiones */
export const investmentsRoutes: Routes = [
  {
    path: '',
    component: InvestmentsShellComponent,
    providers: [
      ListInvestmentsUseCase,
      GetInvestmentUseCase,
      CreateInvestmentUseCase,
      UpdateInvestmentUseCase,
      DeleteInvestmentUseCase,
      RegisterInvestmentContributionUseCase,
      ListInvestmentContributionsUseCase,
      GetInvestmentProjectionUseCase,
      GetInvestmentsSummaryUseCase,
    ],
    children: [
      {
        path: '',
        component: InvestmentListComponent,
      },
      {
        path: ':id',
        component: InvestmentDetailComponent,
      },
    ],
  },
];
