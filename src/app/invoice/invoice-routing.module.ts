import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoicesComponent } from './invoices/invoices.component';
import { InvoiceViewComponent } from './invoice-view/invoice-view.component';
import { InvoiceService } from '../services/invoice.service';
import { NewInvoiceComponent } from './new-invoice/new-invoice.component';
import { InvoiceItemsService } from '../resolvers/invoice-items.service';

const routes: Routes = [
  {
    path : '',
    component : InvoicesComponent
  },
  {
    path: 'view/:id',
    component: InvoiceViewComponent,
    resolve : {
      invoice : InvoiceService,
    }
  },
  {
    path: 'i/:id',
    component: NewInvoiceComponent,
    resolve : {
      invoice : InvoiceService,
      invoiceItems : InvoiceItemsService
    }
  },
  {
    path: 'i',
    component: NewInvoiceComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoiceRoutingModule { }
