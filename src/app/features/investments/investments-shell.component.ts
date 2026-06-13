import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthStateService } from '../../core/auth/application/services/auth-state.service';

/**
 * Shell del módulo de inversiones.
 * Mantiene el mismo layout lateral usado en dashboard/deudas.
 */
@Component({
  selector: 'app-investments-shell',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './investments-shell.component.html',
  styleUrl: './investments-shell.component.scss',
})
export class InvestmentsShellComponent {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  /** Tema oscuro/claro */
  readonly isDarkTheme = signal(false);

  /** Sidebar abierto en móvil */
  readonly isSidebarOpen = signal(false);

  /** Usuario autenticado */
  readonly userName = this.authState.currentUser;

  /** Items del sidebar */
  readonly navItems: { icon: string; label: string; active: boolean; action: () => void }[] = [
    { icon: '🏠', label: 'Inicio',      active: false, action: () => { this.router.navigate(['/dashboard']); this.closeSidebar(); } },
    { icon: '💰', label: 'Ingresos',    active: false, action: () => { this.router.navigate(['/dashboard']); this.closeSidebar(); } },
    { icon: '💸', label: 'Gastos',      active: false, action: () => { this.router.navigate(['/dashboard']); this.closeSidebar(); } },
    { icon: '🏦', label: 'Deudas',      active: false, action: () => { this.router.navigate(['/debts']); this.closeSidebar(); } },
    { icon: '📈', label: 'Inversiones', active: true,  action: () => { this.router.navigate(['/investments']); this.closeSidebar(); } },
    { icon: '📊', label: 'Reportes',    active: false, action: () => {} },
  ];

  /** Alterna tema */
  toggleTheme(): void {
    this.isDarkTheme.update(v => !v);
  }

  /** Alterna sidebar móvil */
  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }

  /** Cierra sidebar móvil */
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  /** Cierra sesión */
  onLogout(): void {
    this.authState.clearCurrentUser();
    this.router.navigate(['/login']);
  }
}
