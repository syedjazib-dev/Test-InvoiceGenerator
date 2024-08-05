import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, debounceTime, first } from 'rxjs';
import IApproval from 'src/app/models/approval.model';
import IUser from 'src/app/models/user.model';
import { AlertService } from 'src/app/services/alert.service';
import { ApprovalService } from 'src/app/services/approval.service';
import { FloatingDropdownService } from 'src/app/services/floating-dropdown.service';
import { FloatingModalService } from 'src/app/services/floating-modal.service';
import { MsgService } from 'src/app/services/msg.service';
import { BtnText } from 'src/assets/static_data/BtnText';
import { Color } from 'src/assets/static_data/Color';
import { ApprovalFields } from 'src/assets/static_data/Fields/ApprovalFields';
import { Order } from 'src/assets/static_data/Order';
import { ApprovalStatus } from 'src/assets/static_data/Status/ApprovalStatus';
import { UserRole } from 'src/assets/static_data/UserRole';
import { Vat } from 'src/assets/static_data/vat';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-approvals',
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.css']
})
export class ApprovalsComponent implements OnInit {

  user: IUser = {} as IUser
  constructor(
    private floatingDropdown: FloatingDropdownService,
    private approvalService: ApprovalService,
    private msgService: MsgService,
    private route: ActivatedRoute,
    private floatingModal: FloatingModalService,
    private router: Router,
    private alertService : AlertService
  ) {
    this.route.parent!.parent!.data.subscribe(data => {
      this.user = data['user'];
    });
  }

  orderBy = ApprovalFields.createDate
  order = Order.DESC

  msgBoxId = 'usersMsgBoxId'
  entityList: IApproval[] = []
  recordPerPageId = 'recordPerPageId'
  recordPerPageOptions = [10, 20, 30, 50, 75, 100]
  recordPerPage = 10
  pageNo = 1
  searchString = ''
  private inputSearch = new Subject<string>();
  createDateFilterInput: HTMLInputElement | null = null
  createDateFilter: Date | null = null
  filterText: string = ""
  totalRecords: number = 0

  totalPageCount: number = 0
  isGettingUser = false

  addCustomerModalId = 'addCustomerModalId'
  
  updateCustomerModelId = 'updateCustomerModelId'
  approvalFilterModalId = 'approvalFilterModalId'
  approvalFilterdropDownId = 'approvalFilterdropDownId'

  isCreatingUser = false
  isUpdatingUser = false

  UserRole = UserRole

  defaultApptovalStatusFilter = 'All'
  approvalStatusFilterInput:  string = this.defaultApptovalStatusFilter;
  approvalStatusFilter:  string = this.defaultApptovalStatusFilter
  approvalStatusOptions = [
    this.defaultApptovalStatusFilter,
    ApprovalStatus.Billed,
    ApprovalStatus.Pending,
    ApprovalStatus.Returned
  ]

  Vat  = Vat
  ApprovalStatus = ApprovalStatus


  ngOnInit(): void {
    this.inputSearch.pipe(debounceTime(1000)).subscribe(searchString => {
      this.getApprovals()
    });

    this.route.queryParams.subscribe((params: Params) => {
      this.pageNo = params['pageNo'] ?? 1
      this.recordPerPage = params['recordPerPage'] ?? 10
      this.createDateFilter = params['createDate'] ?? null
      this.approvalStatusFilter = params['status'] ?? this.defaultApptovalStatusFilter
      this.getApprovals()
    })
  }

  openLink(evnet : Event, path: string, id: string) {
    evnet.stopPropagation()
    this.router.navigate([path, btoa(id)])
  }

  openFloatingDropdown(event: Event, id: string) {
    event.preventDefault();
    this.floatingDropdown.toggeleFloatingDropdown(id)
  }


   // Export as Excel
   isExporting = false
   async exportexcel() {
     if (this.isExporting) {
       return
     }
     this.isExporting = true
     try {
       this.approvalService.exportAsExcel().subscribe(
         (response) => {
           var blob: Blob = response.body as Blob;
 
           var downloadURL = URL.createObjectURL(blob);
           var link = document.createElement('a');
           link.href = downloadURL;
           link.download = "Approvals.xlsx";
           link.click();
           this.msgService.setColor(this.msgBoxId, Color.success)
           this.msgService.setMsg(this.msgBoxId, 'Your excel file exported successfully')
           this.msgService.openMsgBox(this.msgBoxId)
           this.isExporting = false
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
           this.isExporting = false
         }
       )
     } catch (e) {
      if (environment.isDevMode) {
        if (environment.isDevMode) {
            console.log(e)
          }
      }
       this.msgService.setColor(this.msgBoxId, Color.danger)
       this.msgService.setMsg(this.msgBoxId, 'Something is wrong, Try again later.')
       this.msgService.openMsgBox(this.msgBoxId)
       this.isExporting = false
     }
   }



  // delete
  deleteApproval(event :Event, entity: IApproval) {
    event.stopPropagation()
    this.alertService.setAlert({
      title: `Are you sure you want to delete approval #${entity.approvalNo}`,
      msg: 'Note: You will be not able to recover the approval.',
      okBtnColor: Color.danger,
      okBtnText: BtnText.delete,
      cancelBtnText: BtnText.cancel
    })
    this.alertService.onActionClicked.pipe(first()).subscribe(async value => {
      if (value) {

        if(entity.status == ApprovalStatus.Billed){
          this.msgService.setColor(this.msgBoxId, Color.danger)
          this.msgService.setMsg(this.msgBoxId, 'You can not delete billed approval.')
          this.msgService.openMsgBox(this.msgBoxId)
        }

        try {
          this.approvalService.delete(entity.id!).subscribe(
            (response) => {
              if (response.isSuccess) {
                this.msgService.setColor(this.msgBoxId, Color.success)
                this.msgService.setMsg(this.msgBoxId, 'Approval deleted successfully')
                this.msgService.openMsgBox(this.msgBoxId)
                this.getApprovals()
              } else {
                this.msgService.setColor(this.msgBoxId, Color.danger)
                if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
                  this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
                } else {
                  this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later.')
                }
                this.msgService.openMsgBox(this.msgBoxId)
              }
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
            }
          )
        } catch (e) {
          if (environment.isDevMode) {
            console.log(e)
          };
          this.msgService.setColor(this.msgBoxId, Color.danger)
          this.msgService.setMsg(this.msgBoxId, 'Something is wrong, Try again later.')
          this.msgService.openMsgBox(this.msgBoxId)
          this.isUpdatingUser = false
        }
      }
    })
  }

  // Filter
  openFilterModal() {
    this.openFloationgModal(this.approvalFilterModalId)
    this.approvalStatusFilterInput = this.approvalStatusFilter
    setTimeout(()=>{
      this.createDateFilterInput = document.getElementById('createDateFilter') as HTMLInputElement
      if (this.createDateFilter != null) {
        const dateObj = new Date(Number(this.createDateFilter))
        const date = dateObj.getUTCDate() < 10 ? '0' + dateObj.getUTCDate() : dateObj.getUTCDate()
        const month = Number(dateObj.getUTCMonth()) + 1 < 10 ? '0' + (Number(dateObj.getUTCMonth()) + 1) : Number(dateObj.getUTCMonth()) + 1
        const year = dateObj.getUTCFullYear()
        const dateString = `${year}-${month}-${date}`
        this.createDateFilterInput!.value = dateString
      } else {
        this.createDateFilterInput = null
      }
    },500)
  }

  selectInvoiceStatusFilter(status : string){
    this.approvalStatusFilterInput = status
  }


  resetFilters() {
    this.createDateFilterInput = document.getElementById('createDateFilter') as HTMLInputElement
    this.approvalStatusFilterInput = this.defaultApptovalStatusFilter
    this.createDateFilterInput!.value = ''
  }
  
  appyFilter() {
    this.createDateFilterInput = document.getElementById('createDateFilter') as HTMLInputElement

    if (this.createDateFilterInput != null) {
      if (this.createDateFilterInput.value == '') {
        this.router.navigate([],
          {
            queryParams: {
              pageNo: 1,
              status : this.approvalStatusFilterInput,
              createDate : null
            },
            queryParamsHandling: 'merge',
          })
      } else {

        this.router.navigate([],
          {
            queryParams: {
              pageNo: 1,
              status : this.approvalStatusFilterInput,
              createDate : (new Date(this.createDateFilterInput.value)).getTime()
            },
            queryParamsHandling: 'merge',
          })
      }
    }
   
    this.floatingModal.closeFloatingModal(this.approvalFilterModalId)
  }





  async getApprovals() {
    this.isGettingUser = true
    try {
      var params: any = {
        search: this.searchString,
        orderBy: this.orderBy,
        order: this.order,
        pageSize: this.recordPerPage,
        pageNo: this.pageNo,
      }

      if(this.approvalStatusFilter != this.defaultApptovalStatusFilter){
        params.status = this.approvalStatusFilter
      }

      if (this.createDateFilter != null) {
        params.createDateMiliSecondsString = this.createDateFilter
      }

      this.approvalService.getAll(params).subscribe(
        (response) => {
          if (response.isSuccess) {
            this.entityList = response!.data.records
            this.totalRecords = response!.data.totalRecords
            this.totalPageCount = Math.ceil(this.totalRecords / this.recordPerPage)
            this.isGettingUser = false
          } else {
            this.msgService.setColor(this.msgBoxId, Color.danger)
            if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
              this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
            } else {
              this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
            }
            this.msgService.openMsgBox(this.msgBoxId)
          }
          this.isGettingUser = false
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
          this.isGettingUser = false
        }
      )
    } catch (e) {
      if (environment.isDevMode) {
            console.log(e)
          };
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Something is wrong, Try again later.')
      this.msgService.openMsgBox(this.msgBoxId)
      this.isGettingUser = false
    }
  }


  filterData(event: Event) {
    event.preventDefault();
    var searchInputField = event.target as HTMLInputElement
    if (this.searchString == searchInputField.value) {
      return
    }
    this.searchString = searchInputField.value
    this.inputSearch.next(this.searchString)
  }

  openFloationgModal(id: string) {
    this.floatingModal.openFloatingModal(id)
  }

}
