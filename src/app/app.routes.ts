import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { CampaignsComponent } from './pages/campaings/campaigns.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'conversations', loadComponent: () => import('./pages/conversations/conversations.component').then(m => m.ConversationsComponent) },
      { path: 'products', loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent) },
      { path: 'customers', loadComponent: () => import('./pages/customers/customers.component').then(m => m.CustomersComponent) },
      { path: 'orders', loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent) },
      { path: 'whatsapp', loadComponent: () => import('./pages/whatsapp/whatsapp.component').then(m => m.WhatsappComponent) },
      { path: 'campaigns', component: CampaignsComponent },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
