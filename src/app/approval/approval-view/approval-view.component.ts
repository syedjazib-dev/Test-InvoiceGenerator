import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import IApproval from 'src/app/models/approval.model';
import IItem from 'src/app/models/item.model';
import IUser from 'src/app/models/user.model';
import { ApprovalService } from 'src/app/services/approval.service';
import { FloatingModalService } from 'src/app/services/floating-modal.service';
import { MsgService } from 'src/app/services/msg.service';
import { Color } from 'src/assets/static_data/Color';
import { ApprovalStatus } from 'src/assets/static_data/Status/ApprovalStatus';
import { ItemStatus } from 'src/assets/static_data/Status/ItemStatus';
import { Vat } from 'src/assets/static_data/vat';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-approval-view',
  templateUrl: './approval-view.component.html',
  styleUrls: ['./approval-view.component.css']
})
export class ApprovalViewComponent {

  user: IUser = {} as IUser
  approval: IApproval = {} as IApproval
  approvalItems: IItem[] = []
  Vat = Vat
  ApprovalStatus = ApprovalStatus
  ItemStatus = ItemStatus

  msgBoxId = "appMsg"


  constructor(
    private route: ActivatedRoute,
    private floatingModalService: FloatingModalService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private approvalService: ApprovalService,
    private msgService: MsgService
  ) {
    {
      this.route.parent!.parent!.data.subscribe(data => {
        this.user = data['user'];

      });

      this.route.data.subscribe(data => {
        this.approval = data['approval']
        this.approvalItems = data['approvalItems']
        console.log(this.approvalItems)
      });
    }
  }

  printInfoModelId = 'printInfoModelId'
  isPrinting = false

  reciever = new FormControl('', [
    Validators.required
  ])
  terms = new FormControl('', [])
  remarks = new FormControl('', [])


  printInfoForm = new FormGroup({
    reciever: this.reciever,
    terms: this.terms,
    remarks: this.remarks
  })

  openLink(evnet: Event, path: string, id: string) {
    evnet.stopPropagation()
    this.router.navigate([path, btoa(id)])
  }


  onpenPrintModal() {
    this.printInfoForm.reset()
    this.cdr.detectChanges();
    this.floatingModalService.openFloatingModal(this.printInfoModelId)
  }


  async print() {
    if (this.printInfoForm.valid) {
      this.isPrinting = true
      var body = {
        reciever: this.reciever.value!,
        terms: this.terms.value != null ? this.terms.value! : "",
        remarks: this.remarks.value! ?? " ",
        salesman: this.user.name
      }
      this.approvalService.exportPDF(this.approval.id!, body).subscribe(
        (response) => {
          var blob: Blob = response.body as Blob;
          var blobURL = URL.createObjectURL(blob);
          window.open(blobURL);
          this.isPrinting = false
          this.floatingModalService.closeFloatingModal(this.printInfoModelId)
        },
        (error) => {
          if (environment.isDevMode) {
            console.log(error)
          }
          this.msgService.setColor(this.msgBoxId, Color.danger)
          if (error.error.errorMessages && error.error.errorMessages[0] && error.error.errorMessages[0] != "") {
            this.msgService.setMsg(this.msgBoxId, error.error.errorMessages[0])
          } else {
            this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
          }
          this.msgService.openMsgBox(this.msgBoxId)
          this.isPrinting = false
        })
    } else {
      Object.keys(this.printInfoForm.controls).forEach(field => {
        const control = this.printInfoForm.get(field);
        control!.markAsTouched()
        control!.markAsDirty()
      });
    }
  }

}
