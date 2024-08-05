import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, debounceTime, first } from 'rxjs';
import ICustomer from 'src/app/models/customer.model';
import IUser from 'src/app/models/user.model';
import { AlertService } from 'src/app/services/alert.service';
import { CustomerService } from 'src/app/services/customer.service';
import { FloatingDropdownService } from 'src/app/services/floating-dropdown.service';
import { FloatingModalService } from 'src/app/services/floating-modal.service';
import { MsgService } from 'src/app/services/msg.service';
import { BtnText } from 'src/assets/static_data/BtnText';
import { Color } from 'src/assets/static_data/Color';
import { CustomerFields } from 'src/assets/static_data/Fields/CustomerFields';
import { Order } from 'src/assets/static_data/Order';
import { UserRole } from 'src/assets/static_data/UserRole';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {

  user: IUser = {} as IUser
  constructor(
    private floatingDropdown: FloatingDropdownService,
    private customerService: CustomerService,
    private msgService: MsgService,
    private route: ActivatedRoute,
    private floatingModal: FloatingModalService,
    private alertService: AlertService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.route.parent!.parent!.data.subscribe(data => {
      this.user = data['user'];
    });
  }

  orderBy = CustomerFields.createDate
  order = Order.DESC

  msgBoxId = 'usersMsgBoxId'
  entityList: ICustomer[] = []
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
  customerFilterModalId = 'customerFilterModalId'
  updateCustomerModelId = 'updateCustomerModelId'

  isCreatingUser = false
  isUpdatingUser = false

  UserRole = UserRole

  id = new FormControl('',
    [
      Validators.required,
    ]
  )
  name = new FormControl('',
    [
      Validators.required
    ])
  email = new FormControl('',
    [
      Validators.email
    ])
  trn = new FormControl('',
    [
      Validators.minLength(15),
      Validators.maxLength(15),
    ])
  phone = new FormControl('',
    [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(10),
    ])
  address = new FormControl('',
    [
      Validators.required
    ])


  customerAddForm = new FormGroup({
    name: this.name,
    email: this.email,
    trn: this.trn,
    phone: this.phone,
    address: this.address
  })

  customerUpdateForm = new FormGroup({
    id: this.id,
    name: this.name,
    email: this.email,
    trn: this.trn,
    phone: this.phone,
    address: this.address
  })


  ngOnInit(): void {

    this.inputSearch.pipe(debounceTime(1000)).subscribe(searchString => {
      this.getCustomers()
    });

    this.route.queryParams.subscribe((params: Params) => {
      this.pageNo = params['pageNo'] ?? 1
      this.recordPerPage = params['recordPerPage'] ?? 10
      this.createDateFilter = params['createDate'] ?? null
      this.getCustomers()
    })
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
      this.customerService.exportAsExcel().subscribe(
        (response) => {
          var blob: Blob = response.body as Blob;

          var downloadURL = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = downloadURL;
          link.download = "Customers.xlsx";
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
            console.log(e)
          };
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Something is wrong, Try again later.')
      this.msgService.openMsgBox(this.msgBoxId)
      this.isExporting = false
    }
  }


  // delete

  deleteCustomer(entity: ICustomer) {
    this.alertService.setAlert({
      title: 'Are you sure you want to delete customer',
      msg: 'Note: You will be not able to recover the customer.',
      okBtnColor: Color.danger,
      okBtnText: BtnText.delete,
      cancelBtnText: BtnText.cancel
    })
    this.alertService.onActionClicked.pipe(first()).subscribe(async value => {
      if (value) {

        try {
          this.customerService.delete(entity.id!).subscribe(
            (response) => {
              if (response.isSuccess) {
                this.msgService.setColor(this.msgBoxId, Color.success)
                this.msgService.setMsg(this.msgBoxId, 'Customer deleted successfully')
                this.msgService.openMsgBox(this.msgBoxId)
                this.getCustomers()
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
        }
      }
    })
  }


  // upadate
  openUpdateCustomerForm(entity: ICustomer) {
    this.id.setValue(entity.id!.toString())
    this.name.setValue(entity.name)
    this.email.setValue(entity.email!)
    this.trn.setValue(entity.trn!)
    this.phone.setValue(entity.phone)
    this.address.setValue(entity.address!)

    this.openFloationgModal(this.updateCustomerModelId)
  }

  async updateCustomer() {
    if (this.customerUpdateForm.valid) {
      this.isUpdatingUser = true
      try {
        await this.customerService.update(
          {
            id: Number(this.id.value!),
            name: this.name.value!,
            email: this.email.value! ?? '',
            trn: this.trn.value! ?? '',
            phone: this.phone.value!,
            address: this.address.value ?? ''
          }
        ).subscribe(
          (response) => {
            if (response.isSuccess) {
              this.msgService.setColor(this.msgBoxId, Color.success)
              this.msgService.setMsg(this.msgBoxId, 'Customer updated successfully')
              this.msgService.openMsgBox(this.msgBoxId)
              this.floatingModal.closeFloatingModal(this.updateCustomerModelId)
              this.customerUpdateForm.reset()
              this.cdr.detectChanges();
              this.isUpdatingUser = false
              this.getCustomers()
            } else {
              this.msgService.setColor(this.msgBoxId, Color.danger)
              if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
                this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
              } else {
                this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later.')
              }
              this.msgService.openMsgBox(this.msgBoxId)
            }
            this.isUpdatingUser = false
          },
          (error) => {
            if (environment.isDevMode) {
              console.log(error)
            }
            this.msgService.setColor(this.msgBoxId, Color.danger)
            this.msgService.setMsg(this.msgBoxId, 'Something is wrong, Try again later.')
            this.msgService.openMsgBox(this.msgBoxId)
            this.isUpdatingUser = false
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
    } else {
      Object.keys(this.customerUpdateForm.controls).forEach(field => {
        const control = this.customerUpdateForm.get(field);
        control!.markAsTouched()
        control!.markAsDirty()
      });
    }
  }

  // Filter

  openFilterModal() {
    this.openFloationgModal(this.customerFilterModalId)
    setTimeout(() => {
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
    }, 500)
  }

  resetFilters() {
    this.createDateFilterInput = document.getElementById('createDateFilter') as HTMLInputElement
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
              createDate: null
            },
            queryParamsHandling: 'merge',
          })
      } else {

        this.router.navigate([],
          {
            queryParams: {
              pageNo: 1,
              createDate: (new Date(this.createDateFilterInput.value)).getTime()
            },
            queryParamsHandling: 'merge',
          })
      }
    }

    this.floatingModal.closeFloatingModal(this.customerFilterModalId)
  }

  async getCustomers() {
    this.isGettingUser = true
    try {
      var params: any = {
        search: this.searchString,
        orderBy: this.orderBy,
        order: this.order,
        pageSize: this.recordPerPage,
        pageNo: this.pageNo,
      }

      if (this.createDateFilter != null) {
        params.createDateMiliSecondsString = this.createDateFilter
      }

      this.customerService.getAll(params).subscribe(
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


  // create user

  openAddCustomerForm(event: Event) {
    event.preventDefault()
    this.openFloationgModal(this.addCustomerModalId)
    this.customerAddForm.reset()
    this.cdr.detectChanges();
  }

  async createCustomer() {
    if (this.name.valid &&
      this.email.valid &&
      this.trn.valid &&
      this.phone.valid &&
      this.address.valid
    ) {
      this.isCreatingUser = true
      try {
        await this.customerService.create(
          {
            name: this.name.value!,
            email: this.email.value! ?? '',
            trn: this.trn.value! ?? '',
            phone: this.phone.value!,
            address: this.address.value ?? ''
          }
        ).subscribe(
          (response) => {
            if (response.isSuccess) {
              this.msgService.setColor(this.msgBoxId, Color.success)
              this.msgService.setMsg(this.msgBoxId, 'Customer created successfully')
              this.msgService.openMsgBox(this.msgBoxId)
              this.floatingModal.closeFloatingModal(this.addCustomerModalId)
              this.customerAddForm.reset()
              this.cdr.detectChanges();
              this.isCreatingUser = false
              this.getCustomers()
            } else {
              this.msgService.setColor(this.msgBoxId, Color.danger)
              if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
                this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
              } else {
                this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later.')
              }
              this.msgService.openMsgBox(this.msgBoxId)
            }
            this.isCreatingUser = false
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
            this.isCreatingUser = false
          }
        )
      } catch (e) {
        if (environment.isDevMode) {
            console.log(e)
          };
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'Something is wrong, Try again later.')
        this.msgService.openMsgBox(this.msgBoxId)
        this.isCreatingUser = false
      }
    } else {
      Object.keys(this.customerAddForm.controls).forEach(field => {
        const control = this.customerAddForm.get(field);
        control!.markAsTouched()
        control!.markAsDirty()
      });
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
