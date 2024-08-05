import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceRoutingModule } from './invoice-routing.module';
import { InvoicesComponent } from './invoices/invoices.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewInvoiceComponent } from './new-invoice/new-invoice.component';
import { InvoiceViewComponent } from './invoice-view/invoice-view.component';


@NgModule({
  declarations: [
    InvoicesComponent,
    NewInvoiceComponent,
    InvoiceViewComponent
  ],
  imports: [
    CommonModule,
    InvoiceRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class InvoiceModule { }
