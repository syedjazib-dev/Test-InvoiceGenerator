import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthService } from './services/auth.service';
import { AuthorizationGuard } from './guards/authorization-guard.guard';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: {
      authOnly: true,
    },
    canActivate: [AuthGuard],
    resolve: {
      user: AuthService
    },
    children: [
      {
        path: '',
        redirectTo: '/invoices', pathMatch: 'full' 
      },
      {
        path: 'users',
        loadChildren: async () => (await import('./user/user.module')).UserModule,
        canActivate : [AuthorizationGuard],
      },
      {
        path: 'customers',
        loadChildren: async () => (await import('./customer/customer.module')).CustomerModule,
      },
      {
        path: 'approvals',
        loadChildren: async () => (await import('./approval/approval.module')).ApprovalModule,
      },
      {
        path: 'invoices',
        loadChildren: async () => (await import('./invoice/invoice.module')).InvoiceModule,
      },
      
    ]
  },
  {
    path: 'login',
    canActivate: [LoginGuard],
    loadChildren: async () => (await import('./authentication/authentication.module')).AuthenticationModule
  },
  { path: '**', redirectTo: '/invoices', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
