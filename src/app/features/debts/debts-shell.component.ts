import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthStateService } from '../../core/auth/application/services/auth-state.service';

/**
 * Shell del módulo de deudas.
 * Proporciona el sidebar de navegación y el router-outlet para las páginas de deudas.
 * Replica la estructura visual del DashboardComponent.
 */
@Component({
  selector: 'app-debts-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './debts-shell.component.html',
  styleUrl: './debts-shell.component.scss',
})
export class DebtsShellComponent {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  /** Tema oscuro/claro */
  readonly isDarkTheme = signal(false);

  /** Sidebar abierto en móvil */
  readonly isSidebarOpen = signal(false);

  /** Usuario autenticado */
  readonly userName = this.authState.currentUser;

  /** Items de navegación del sidebar */
  readonly navItems: { icon: string; label: string; active: boolean; action: () => void }[] = [
    {
      icon: '🏠',
      label: 'Inicio',
      active: false,
      action: () => { this.router.navigate(['/dashboard']); this.closeSidebar(); },
    },
    {
      icon: '💰',
      label: 'Ingresos',
      active: false,
      action: () => { this.router.navigate(['/dashboard']); this.closeSidebar(); },
    },
    {
      icon: '💸',
      label: 'Gastos',
      active: false,
      action: () => { this.router.navigate(['/dashboard']); this.closeSidebar(); },
    },
    {
      icon: '🏦',
      label: 'Deudas',
      active: true,
      action: () => { this.router.navigate(['/debts']); this.closeSidebar(); },
    },
    {
      icon: '📊',
      label: 'Presupuestos',
      active: false,
      action: () => {},
    },
    {
      icon: '📈',
      label: 'Reportes',
      active: false,
      action: () => {},
    },
  ];

  /**
   * Alterna entre tema claro y oscuro.
   */
  toggleTheme(): void {
    console.log('[DebtsShellComponent] toggleTheme()');
    this.isDarkTheme.update(v => !v);
  }

  /**
   * Alterna la visibilidad del sidebar en móvil.
   */
  toggleSidebar(): void {
    console.log('[DebtsShellComponent] toggleSidebar()');
    this.isSidebarOpen.update(v => !v);
  }

  /**
   * Cierra el sidebar en móvil.
   */
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  /**
   * Cierra sesión y redirige al login.
   */
  onLogout(): void {
    console.log('[DebtsShellComponent] onLogout()');
    this.authState.clearCurrentUser();
    this.router.navigate(['/login']);
  }
}
