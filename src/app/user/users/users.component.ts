import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, debounceTime, first } from 'rxjs';
import IUser from 'src/app/models/user.model';
import { AlertService } from 'src/app/services/alert.service';
import { APIService } from 'src/app/services/api.service';
import { FloatingDropdownService } from 'src/app/services/floating-dropdown.service';
import { FloatingModalService } from 'src/app/services/floating-modal.service';
import { MsgService } from 'src/app/services/msg.service';
import { UserService } from 'src/app/services/user.service';
import { BtnText } from 'src/assets/static_data/BtnText';
import { Color } from 'src/assets/static_data/Color';
import { UserFields } from 'src/assets/static_data/Fields/UserFields';
import { Order } from 'src/assets/static_data/Order';
import { UserRole } from 'src/assets/static_data/UserRole';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {

  user: IUser = {} as IUser
  constructor(
    private floatingDropdown: FloatingDropdownService,
    private userService: UserService,
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
  msgBoxId = 'usersMsgBoxId'
  userList: IUser[] = []
  recordPerPageId = 'recordPerPageId'
  recordPerPageOptions = [5, 10, 20, 30, 50, 75, 100]
  recordPerPage = 10
  pageNo = 1
  searchString = ''
  private inputSearch = new Subject<string>();
  createDateFilterInput: HTMLInputElement | null = null
  createDateFilter: number | null = null
  filterText: string = ""
  totalRecords: number = 0
  roleOptions = [
    UserRole.admin,
    UserRole.salesman
  ]
  orderBy = UserFields.createDate
  order = Order.DESC

  defaultRoleFilter = 'All'
  roleFilterInput: UserRole | string = this.defaultRoleFilter;
  roleFilter: UserRole | string = this.defaultRoleFilter
  filterRoleOprions = [
    this.defaultRoleFilter,
    UserRole.admin,
    UserRole.salesman,
  ]

  defaultActiveFilter = 'Both'
  enabled = 'Enabled'
  disabled = 'Disabled'
  activeFilterInput: string = this.enabled;
  activeFilter: string = this.enabled
  filterActiveOptions = [
    this.defaultActiveFilter,
    this.enabled,
    this.disabled
  ]

  totalPageCount: number = 0
  isGettingUser = false

  addUserModalId = 'addUserModalId'
  roleDropdownId = 'roleDropdownId'
  activeDropdownId = 'activeDropdownId'
  userFilterModalId = 'userFilterModalId'
  updateUserModelId = 'updateUserModelId'

  isCreatingUser = false
  isUpdatingUser = false

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
      Validators.required,
      Validators.email
    ])
  password = new FormControl('',
    [
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/),
      Validators.required
    ])

  selectedRole = UserRole.salesman

  userForm = new FormGroup({
    name: this.name,
    email: this.email,
    password: this.password
  })

  userUpdateForm = new FormGroup({
    id: this.id,
    name: this.name,
    email: this.email,
  })


  ngOnInit(): void {
    this.inputSearch.pipe(debounceTime(1000)).subscribe(searchString => {
      this.getUsers()
    });

    this.route.queryParams.subscribe((params: Params) => {
      this.pageNo = params['pageNo'] ?? 1
      this.recordPerPage = params['recordPerPage'] ?? 10
      this.createDateFilter = params['createDate'] ?? null
      this.roleFilter = params['role'] ?? this.defaultRoleFilter
      this.activeFilter = params['status'] ?? this.enabled
      this.getUsers()
    })
  }

  openFloatingDropdown(event: Event, id: string) {
    event.preventDefault();
    this.floatingDropdown.toggeleFloatingDropdown(id)
  }


  // Export as Excel
  isExporting = false
  async exportexcel() {
    if(this.isExporting){
      return
    }
    this.isExporting = true
    try {
      this.userService.exportAsExcel().subscribe(
        (response) => {
          var blob: Blob = response.body as Blob;

          var downloadURL = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = downloadURL;
          link.download = "Users.xlsx";
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


  // upadate
  opneUpdateUserForm(userToBeUpdated: IUser) {
    this.id.setValue(userToBeUpdated.id!)
    this.email.setValue(userToBeUpdated.email)
    this.name.setValue(userToBeUpdated.name)
    this.selectedRole = userToBeUpdated.role.toString()

    this.email.disable()

    this.openFloationgModal(this.updateUserModelId)
  }

  async updateUser() {
    if (this.userUpdateForm.valid) {
      this.isUpdatingUser = true
      try {
        this.userService.update(
          {
            id: this.id.value!,
            name: this.name.value!,
            email: this.email.value!,
            role: this.selectedRole
          }).subscribe(
            (response) => {
              if (response.isSuccess) {
                this.msgService.setColor(this.msgBoxId, Color.success)
                this.msgService.setMsg(this.msgBoxId, 'User updated successfully')
                this.msgService.openMsgBox(this.msgBoxId)
                this.floatingModal.closeFloatingModal(this.updateUserModelId)
                this.userUpdateForm.reset()
                this.cdr.detectChanges();
                this.selectedRole = UserRole.salesman
                this.getUsers()
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
              if (error.error.errorMessages && error.error.errorMessages[0] && error.error.errorMessages[0] != "") {
                this.msgService.setMsg(this.msgBoxId, error.error.errorMessages[0])
              } else {
                this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
              }
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
      Object.keys(this.userUpdateForm.controls).forEach(field => {
        const control = this.userUpdateForm.get(field);
        control!.markAsTouched()
        control!.markAsDirty()
      });
    }
  }

  // disable User
  disableUser(userItem: IUser) {
    if (userItem.id == this.user.id) {
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'You can not diable your self.')
      this.msgService.openMsgBox(this.msgBoxId)
      return
    }
    this.alertService.setAlert({
      title: 'Are you sure you want to disable user',
      msg: 'Note: Users data associated with invoices/approvals will remain as it is, You can enable user latter.',
      okBtnColor: Color.danger,
      okBtnText: BtnText.disable,
      cancelBtnText: BtnText.cancel
    })
    this.alertService.onActionClicked.pipe(first()).subscribe(async value => {
      if (value) {

        try {
          this.userService.disable(userItem.id!).subscribe(
            (response) => {
              if (response.isSuccess) {
                this.msgService.setColor(this.msgBoxId, Color.success)
                this.msgService.setMsg(this.msgBoxId, 'User Disabled successfully')
                this.msgService.openMsgBox(this.msgBoxId)
                this.getUsers()
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
          this.isUpdatingUser = false
        }
      }
    })
  }

  // enable User
  enableUser(userItem: IUser) {
    if (userItem.id == this.user.id) {
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'You can not enable your self.')
      this.msgService.openMsgBox(this.msgBoxId)
      return
    }
    this.alertService.setAlert({
      title: 'Are you sure you want to enable user',
      msg: 'Note: Users data associated with invoices/approvals will remain as it is.',
      okBtnColor: Color.success,
      okBtnText: BtnText.enable,
      cancelBtnText: BtnText.cancel
    })
    this.alertService.onActionClicked.pipe(first()).subscribe(async value => {
      if (value) {

        try {
          this.userService.enable(userItem.id!).subscribe(
            (response) => {
              if (response.isSuccess) {
                this.msgService.setColor(this.msgBoxId, Color.success)
                this.msgService.setMsg(this.msgBoxId, 'User enabled successfully')
                this.msgService.openMsgBox(this.msgBoxId)
                this.getUsers()
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
              console.log(error)
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
          this.isUpdatingUser = false
        }
      }
    })
  }

  // Filter

  openFilterModal() {
    this.openFloationgModal(this.userFilterModalId)
    this.roleFilterInput = this.roleFilter
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

  selectRoleFilter(role: UserRole) {
    this.roleFilterInput = role
  }

  selectActiveFilter(activeString: string) {
    this.activeFilterInput = activeString
  }

  resetFilters() {
    this.createDateFilterInput = document.getElementById('createDateFilter') as HTMLInputElement
    this.roleFilterInput = this.defaultRoleFilter
    this.createDateFilterInput!.value = ''
    this.activeFilterInput = this.enabled
  }

  appyFilter() {
    this.createDateFilterInput = document.getElementById('createDateFilter') as HTMLInputElement

    if (this.createDateFilterInput != null) {
      if (this.createDateFilterInput.value == '') {
        this.router.navigate([],
          {
            queryParams: {
              pageNo: 1,
              status : this.activeFilterInput,
              role : this.roleFilterInput,
              createDate : null
            },
            queryParamsHandling: 'merge',
          })
      } else {

        this.router.navigate([],
          {
            queryParams: {
              pageNo: 1,
              status : this.activeFilterInput,
              role : this.roleFilterInput,
              createDate : (new Date(this.createDateFilterInput.value)).getTime()
            },
            queryParamsHandling: 'merge',
          })
      }
    }
   
    this.floatingModal.closeFloatingModal(this.userFilterModalId)
  }





  // create user

  openAddUserForm(event: Event) {
    event.preventDefault()
    this.email.enable()
    this.userForm.reset()
    this.cdr.detectChanges();
    this.openFloationgModal(this.addUserModalId)
  }

  selectRole(role: UserRole) {
    this.selectedRole = role.toString()
  }

  async createUser() {
    if (this.userForm.valid) {
      this.isCreatingUser = true
      try {
        this.userService.create(
          {
            name: this.name.value!,
            email: this.email.value!,
            password: this.password.value!,
            isActive: true,
            role: this.selectedRole
          }).subscribe(
            (response) => {
              if (response.isSuccess) {
                this.msgService.setColor(this.msgBoxId, Color.success)
                this.msgService.setMsg(this.msgBoxId, 'User created successfully.')
                this.msgService.openMsgBox(this.msgBoxId)
                this.floatingModal.closeFloatingModal(this.addUserModalId)
                this.userForm.reset()
                this.cdr.detectChanges();
                this.selectedRole = UserRole.salesman
                this.isCreatingUser = false
                this.getUsers()
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
        this.isCreatingUser = false
      }
    } else {
      Object.keys(this.userForm.controls).forEach(field => {
        const control = this.userForm.get(field);
        control!.markAsTouched()
        control!.markAsDirty()
      });
    }
  }



  // Get users
  async getUsers() {
    this.isGettingUser = true
    try {
      var params: any = {
        search: this.searchString,
        orderBy: this.orderBy,
        order: this.order,
        pageSize: this.recordPerPage,
        pageNo: this.pageNo,
      }

      if (this.roleFilter != this.defaultRoleFilter) {
        params.role = this.roleFilter
      }

      if (this.activeFilter != this.defaultActiveFilter) {
        params.isActive = this.activeFilter == this.enabled ? true : false
      }

      if (this.createDateFilter != null) {
        params.createDateMiliSecondsString = this.createDateFilter
      }


      this.userService.getAll(params).subscribe(
        (response) => {
          if (response.isSuccess) {
            this.userList = response!.data.records
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
