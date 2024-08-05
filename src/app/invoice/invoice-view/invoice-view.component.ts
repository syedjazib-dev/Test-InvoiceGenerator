import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import IInvoice from 'src/app/models/invoice.model';
import IItem from 'src/app/models/item.model';
import IUser from 'src/app/models/user.model';
import { ApprovalService } from 'src/app/services/approval.service';
import { FloatingModalService } from 'src/app/services/floating-modal.service';
import { InvoiceService } from 'src/app/services/invoice.service';
import { MsgService } from 'src/app/services/msg.service';
import { Color } from 'src/assets/static_data/Color';
import { InvoiceStatus } from 'src/assets/static_data/Status/InvoiceStatus';
import { ItemStatus } from 'src/assets/static_data/Status/ItemStatus';
import { Vat } from 'src/assets/static_data/vat';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-invoice-view',
  templateUrl: './invoice-view.component.html',
  styleUrls: ['./invoice-view.component.css']
})
export class InvoiceViewComponent {

  user: IUser = {} as IUser
  invoice: IInvoice = {} as IInvoice
  invoiceItems: IItem[] = []
  Vat = Vat
  ItemStatus = ItemStatus
  msgBoxId = "appMsg"

  constructor(
    private route: ActivatedRoute,
    private floatingModalService: FloatingModalService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private invocieService: InvoiceService,
    private msgService: MsgService
  ) {

    this.route.parent!.parent!.data.subscribe(data => {
      this.user = data['user'];

    });

    this.route.data.subscribe(data => {
      this.invoice = data['invoice']
      this.invoice.invoiceItems!.forEach(invoiceItem => {
        if (invoiceItem.item.status != ItemStatus.Splitted) {
          this.invoiceItems.push(invoiceItem.item)
        }
      })
    });
  }


  openLink(evnet: Event, path: string, id: string) {
    evnet.stopPropagation()
    this.router.navigate([path, btoa(id)])
  }

  onpenPrintModal() {
    this.printInfoForm.reset()
    this.cdr.detectChanges();
    this.floatingModalService.openFloatingModal(this.printInfoModelId)
  }

  printInfoModelId = 'printInfoModelId'
  isPrinting = false

  InvoiceStatus = InvoiceStatus

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


  async print() {
    if (this.printInfoForm.valid) {
      this.isPrinting = true
      var body = {
        reciever: this.reciever.value!,
        terms: this.terms.value != null ? this.terms.value! : "",
        remarks: this.remarks.value! ?? " ",
        salesman: this.user.name
      }
      this.invocieService.exportPDF(this.invoice.id!, body).subscribe(
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
