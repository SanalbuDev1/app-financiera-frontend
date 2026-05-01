import { Routes } from '@angular/router';
import { RegisterComponent } from './register.component';
import { RegisterUseCase } from '../../core/auth/application/use-cases/register.use-case';

export const registerRoutes: Routes = [
  {
    path: '',
    component: RegisterComponent,
    providers: [RegisterUseCase],
  },
];
