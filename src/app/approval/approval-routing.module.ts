import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApprovalsComponent } from './approvals/approvals.component';
import { NewApprovalComponent } from './new-approval/new-approval.component';
import { ApprovalService } from '../services/approval.service';
import { ItemService } from '../services/item.service';
import { ApprovalViewComponent } from './approval-view/approval-view.component';
import { ApprovalItemsService } from '../resolvers/approval-items.service';

const routes: Routes = [
  {
    path:'',
    component: ApprovalsComponent
  },
  {
    path: 'view/:id',
    component: ApprovalViewComponent,
    resolve : {
      approval : ApprovalService,
      approvalItems : ApprovalItemsService
    }
  },
  {
    path: 'a/:id',
    component: NewApprovalComponent,
    resolve : {
      approval : ApprovalService,
      approvalItems : ApprovalItemsService
    }
  },
  {
    path: 'a',
    component: NewApprovalComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApprovalRoutingModule { }
