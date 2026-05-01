import { Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { LoginUseCase } from '../../core/auth/application/use-cases/login.use-case';

export const loginRoutes: Routes = [
  {
    path: '',
    component: LoginComponent,
    providers: [LoginUseCase],
  },
];
