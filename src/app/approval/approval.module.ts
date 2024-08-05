import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApprovalRoutingModule } from './approval-routing.module';
import { ApprovalsComponent } from './approvals/approvals.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewApprovalComponent } from './new-approval/new-approval.component';
import { ApprovalViewComponent } from './approval-view/approval-view.component';


@NgModule({
  declarations: [
    ApprovalsComponent,
    NewApprovalComponent,
    ApprovalViewComponent
  ],
  imports: [
    CommonModule,
    ApprovalRoutingModule,
    SharedModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class ApprovalModule { }
