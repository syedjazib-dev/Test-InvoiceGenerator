import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, first, take } from 'rxjs';
import IApproval from 'src/app/models/approval.model';
import ICustomer from 'src/app/models/customer.model';
import IItem from 'src/app/models/item.model';
import IUser from 'src/app/models/user.model';
import { AlertService } from 'src/app/services/alert.service';
import { ApprovalService } from 'src/app/services/approval.service';
import { CustomerService } from 'src/app/services/customer.service';
import { FloatingDropdownService } from 'src/app/services/floating-dropdown.service';
import { FloatingModalService } from 'src/app/services/floating-modal.service';
import { ItemService } from 'src/app/services/item.service';
import { MsgService } from 'src/app/services/msg.service';
import { BtnText } from 'src/assets/static_data/BtnText';
import { Color } from 'src/assets/static_data/Color';
import { CurrancyConversionRate } from 'src/assets/static_data/CurrancyConversionRate';
import { Curracy } from 'src/assets/static_data/Currency';
import { CustomerFields } from 'src/assets/static_data/Fields/CustomerFields';
import { Order } from 'src/assets/static_data/Order';
import { QuantityUnit } from 'src/assets/static_data/QuatityCategory';
import { ApprovalStatus } from 'src/assets/static_data/Status/ApprovalStatus';
import { ItemStatus } from 'src/assets/static_data/Status/ItemStatus';
import { UserRole } from 'src/assets/static_data/UserRole';
import { Vat } from 'src/assets/static_data/vat';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-new-approval',
  templateUrl: './new-approval.component.html',
  styleUrls: ['./new-approval.component.css']
})
export class NewApprovalComponent implements OnInit {

  user: IUser = {} as IUser
  constructor(
    private floatingDropdown: FloatingDropdownService,
    private customerService: CustomerService,
    private approvalService: ApprovalService,
    private itemService: ItemService,
    private msgService: MsgService,
    private route: ActivatedRoute,
    private router: Router,
    private floatingModal: FloatingModalService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
  ) {

    this.route.parent!.parent!.data.subscribe(data => {
      this.user = data['user'];
    });

    this.route.data.subscribe(data => {
      this.approval = data['approval']
      this.approvalItems = data['approvalItems']
      if (this.approval && this.approvalItems) {
        this.isUpdate = true
        this.init()
      }
    });
  }

  approval: IApproval | null = null
  approvalItems: IItem[] | null = null
  inputSearch = new Subject<string>();
  filterText: string = ""
  isCreatingUser = false
  isUpdate = false
  Vat = Vat
  ItemStatus = ItemStatus

  init() {
    this.selectCustomer(this.approval!.customer!)
    this.items = []
    const map = {}
    const roots = [] as any

    this.approvalItems!.forEach(item => {
      var invoiceIds:number[] = []
      if(item.invoiceItems != null){
        item.invoiceItems.forEach(invoiceItem => {
          invoiceIds.push(invoiceItem.invoiceId)
        })
      }
      item.newInvoiceIds = invoiceIds
      map[item.id!] = item
      item.splittedItems = []
    })
    this.approvalItems!.forEach(item => {
      if (item.parentItemId !== null) {
        if (map[item.parentItemId!]) {
          map[item.parentItemId!].splittedItems.push(item);
        }
      } else {
        roots.push(item);
      }
    })

    roots.forEach(item => {
      var newItem = {
        id: 0,
        parentItemId: 0,
        newInvoiceIds : [] as number[],
        haveBilledChild : false,
        description: new FormControl('', [
          Validators.required
        ]),
        lotNo: new FormControl('', []),
        weightCarats: new FormControl('', [
          Validators.required,
        ]),
        quantityUnit: QuantityUnit.Carats.toString(),
        pricePerUnit: new FormControl('', [
          Validators.required,
        ]),
        pricePerUnitCurrancy: Curracy.AED.toString(),
        status: this.defaultItemStatus.toString(),
        splittedItems: [] as any,
        quantityDropDownId: 'quantityDropDownId' + uuidv4(),
        statusDropDownId: 'statusDropDownId' + uuidv4(),
        pricePerUnitCurrancyDropDownId: 'pricePerUnitCurrancyDropDownId' + uuidv4(),
        isQuantityError: false,
        quantityErrorMessange: ''
      }

      newItem.id = item.id!
      newItem.newInvoiceIds = item.newInvoiceIds
      newItem.description.setValue(item.description)
      newItem.lotNo.setValue(item.lotNo != null ? item.lotNo.toString() : '')
      newItem.weightCarats.setValue(item.weightCarats.toString())
      newItem.pricePerUnit.setValue(item.pricePerUnit.toString())
      newItem.pricePerUnitCurrancy = item.pricePerUnitCurrancy
      newItem.quantityUnit = item.quantityUnit
      newItem.status = item.status
      newItem.splittedItems = []
      if (item.parentItemId != null) {
        newItem.parentItemId = item.parentItemId!
      }

      //level - 1
      if (item.status == ItemStatus.Splitted) {
        newItem.lotNo.disable()
        newItem.description.disable()
        newItem.weightCarats.disable()
        newItem.pricePerUnit.disable()
      }
      item.splittedItems!.forEach(splittedItem1 => {
        var newItem1 = {
          id: 0,
          parentItemId: 0,
          newInvoiceIds : [] as number[],
          haveBilledChild : false,
          description: new FormControl('', [
            Validators.required
          ]),
          lotNo: new FormControl('', []),
          weightCarats: new FormControl('', [
            Validators.required,
          ]),
          quantityUnit: QuantityUnit.Carats.toString(),
          pricePerUnit: new FormControl('', [
            Validators.required,
          ]),
          pricePerUnitCurrancy: Curracy.AED.toString(),
          status: this.defaultItemStatus.toString(),
          splittedItems: [] as any,
          quantityDropDownId: 'quantityDropDownId' + uuidv4(),
          statusDropDownId: 'statusDropDownId' + uuidv4(),
          pricePerUnitCurrancyDropDownId: 'pricePerUnitCurrancyDropDownId' + uuidv4(),
          isQuantityError: false,
          quantityErrorMessange: ''
        }

        newItem1.id = splittedItem1.id!
        newItem1.newInvoiceIds = splittedItem1.newInvoiceIds
        newItem1.description.setValue(splittedItem1.description)
        newItem1.lotNo.setValue(splittedItem1.lotNo != null ? splittedItem1.lotNo.toString() : '')
        newItem1.weightCarats.setValue(splittedItem1.weightCarats.toString())
        newItem1.pricePerUnit.setValue(splittedItem1.pricePerUnit.toString())
        newItem1.pricePerUnitCurrancy = splittedItem1.pricePerUnitCurrancy
        newItem1.quantityUnit = splittedItem1.quantityUnit
        newItem1.status = splittedItem1.status
        newItem1.splittedItems = []

        newItem1.description.disable()
        newItem1.lotNo.disable()
        newItem1.pricePerUnit.disable()
        if (splittedItem1.parentItemId != null) {
          newItem1.parentItemId = splittedItem1.parentItemId!
        }

        if (splittedItem1.status == ItemStatus.Splitted) {
          newItem1.lotNo.disable()
          newItem1.description.disable()
          newItem1.weightCarats.disable()
          newItem1.pricePerUnit.disable()
        }

        //level- 2
        splittedItem1.splittedItems!.forEach(splittedItem2 => {
          var newItem2 = {
            id: 0,
            parentItemId: 0,
            newInvoiceIds : [] as number[],
            haveBilledChild : false,
            description: new FormControl('', [
              Validators.required
            ]),
            lotNo: new FormControl('', []),
            weightCarats: new FormControl('', [
              Validators.required,
            ]),
            quantityUnit: QuantityUnit.Carats.toString(),
            pricePerUnit: new FormControl('', [
              Validators.required,
            ]),
            pricePerUnitCurrancy: Curracy.AED.toString(),
            status: this.defaultItemStatus.toString(),
            splittedItems: [] as any,
            quantityDropDownId: 'quantityDropDownId' + uuidv4(),
            statusDropDownId: 'statusDropDownId' + uuidv4(),
            pricePerUnitCurrancyDropDownId: 'pricePerUnitCurrancyDropDownId' + uuidv4(),
            isQuantityError: false,
            quantityErrorMessange: ''
          }

          newItem2.id = splittedItem2.id!
          newItem2.newInvoiceIds = splittedItem2.newInvoiceIds
          newItem2.description.setValue(splittedItem2.description)
          newItem2.lotNo.setValue(splittedItem2.lotNo != null ? splittedItem2.lotNo.toString() : '')
          newItem2.weightCarats.setValue(splittedItem2.weightCarats.toString())
          newItem2.pricePerUnit.setValue(splittedItem2.pricePerUnit.toString())
          newItem2.pricePerUnitCurrancy = splittedItem2.pricePerUnitCurrancy
          newItem2.quantityUnit = splittedItem2.quantityUnit
          newItem2.status = splittedItem2.status
          newItem2.splittedItems = []
          newItem2.description.disable()
          newItem2.lotNo.disable()
          newItem2.pricePerUnit.disable()
          if (splittedItem2.parentItemId != null) {
            newItem2.parentItemId = splittedItem2.parentItemId!
          }

          if (splittedItem2.status == ItemStatus.Splitted) {
            newItem2.lotNo.disable()
            newItem2.description.disable()
            newItem2.weightCarats.disable()
            newItem2.pricePerUnit.disable()
          }

          //level - 3
          splittedItem2.splittedItems!.forEach(splittedItem3 => {
            var newItem3 = {
              id: 0,
              parentItemId: 0,
              newInvoiceIds : [] as number[],
              haveBilledChild : false,
              description: new FormControl('', [
                Validators.required
              ]),
              lotNo: new FormControl('', []),
              weightCarats: new FormControl('', [
                Validators.required,
              ]),
              quantityUnit: QuantityUnit.Carats.toString(),
              pricePerUnit: new FormControl('', [
                Validators.required,
              ]),
              pricePerUnitCurrancy: Curracy.AED.toString(),
              status: this.defaultItemStatus.toString(),
              splittedItems: [] as any,
              quantityDropDownId: 'quantityDropDownId' + uuidv4(),
              statusDropDownId: 'statusDropDownId' + uuidv4(),
              pricePerUnitCurrancyDropDownId: 'pricePerUnitCurrancyDropDownId' + uuidv4(),
              isQuantityError: false,
              quantityErrorMessange: ''
            }

            newItem3.id = splittedItem3.id!
            newItem3.newInvoiceIds = splittedItem3.newInvoiceIds
            newItem3.description.setValue(splittedItem3.description)
            newItem3.lotNo.setValue(splittedItem3.lotNo != null ? splittedItem3.lotNo.toString() : '')
            newItem3.weightCarats.setValue(splittedItem3.weightCarats.toString())
            newItem3.pricePerUnit.setValue(splittedItem3.pricePerUnit.toString())
            newItem3.pricePerUnitCurrancy = splittedItem3.pricePerUnitCurrancy
            newItem3.quantityUnit = splittedItem3.quantityUnit
            newItem3.status = splittedItem3.status
            newItem3.splittedItems = []
            newItem3.description.disable()
            newItem3.lotNo.disable()
            newItem3.pricePerUnit.disable()
            if (splittedItem3.parentItemId != null) {
              newItem3.parentItemId = splittedItem3.parentItemId!
            }
            if(newItem3.status == ItemStatus.Billed){
              newItem2.haveBilledChild = true
            }
            if(newItem3.haveBilledChild){
              newItem2.haveBilledChild = true
            }
            newItem2.splittedItems.push(newItem3)
          })
          if(newItem2.status == ItemStatus.Billed){
            newItem1.haveBilledChild = true
          }
          if(newItem2.haveBilledChild){
            newItem1.haveBilledChild = true
          }
          newItem1.splittedItems.push(newItem2)
        })
        if(newItem1.status == ItemStatus.Billed){
          newItem.haveBilledChild = true
        }
        if(newItem1.haveBilledChild){
          newItem.haveBilledChild = true
        }
        newItem.splittedItems.push(newItem1)

      })
      this.items.push(newItem)

    })
  }
  

  ngOnInit(): void {
    this.getCustomers()
    this.inputSearch.pipe(debounceTime(1000)).subscribe(searchString => {
      this.getCustomers()
    });
    this.email.disable()
    this.trn.disable()
    this.address.disable()
    this.phone.disable()
  }

  msgBoxId = 'appMsg'
  customerFloatingDropdownId = 'customerFloatingDropdownId'
  addCustomerModalId = 'addCustomerModalId'
  subItemCountError = 'sub-item quantities don\'t match the expected value.'
  searchString = ''
  isSaving = false
  isSavingRecords = false
  isPreviewing = false
  isDeleting = false

  itemsToRemove: IItem[] = []

  CurracySelectOptions = [
    Curracy.AED,
    Curracy.USD
  ]

  quatityCategorySelectOptions = [
    QuantityUnit.Carats,
    QuantityUnit.Pices
  ]

  defaultItemStatus = ItemStatus.Pending
  itemStatusOptions = [
    ItemStatus.Pending,
    ItemStatus.Splitted,
    ItemStatus.Returned
  ]

  customersSelectOptions: ICustomer[] = []
  selectedCustomer: ICustomer | null = null

  selectCustomer(customer: ICustomer) {
    this.selectedCustomer = customer
    this.phone.setValue(this.selectedCustomer.phone)
    this.email.setValue(this.selectedCustomer.email!)
    this.trn.setValue(this.selectedCustomer.trn!)
    this.address.setValue(this.selectedCustomer.address!)
  }

  Currancy = Curracy
  UserRole = UserRole
  CurrancyConversionRate = CurrancyConversionRate

  email = new FormControl('', [])
  trn = new FormControl('', [])
  phone = new FormControl('', [])
  address = new FormControl('', [])

  newName = new FormControl('',
    [
      Validators.required
    ])
  newEmail = new FormControl('',
    [
      Validators.email
    ])
  newTRN = new FormControl('',
    [
      Validators.minLength(15),
      Validators.maxLength(15),
    ])
  newPhone = new FormControl('',
    [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(10),
    ])
  newAddress = new FormControl('',
    [
      Validators.required
    ])

  customerAddForm = new FormGroup({
    name: this.newName,
    email: this.newEmail,
    trn: this.newTRN,
    phone: this.newPhone,
    address: this.newAddress
  })


  newItemContollers = {
    id: 0,
    parentItemId: 0,
    newInvoiceIds : [] as number[],
    haveBilledChild : false,
    description: new FormControl('', [
      Validators.required
    ]),
    lotNo: new FormControl('', []),
    weightCarats: new FormControl('', [
      Validators.required,
    ]),
    quantityUnit: QuantityUnit.Carats.toString(),
    pricePerUnit: new FormControl('', [
      Validators.required,
    ]),
    pricePerUnitCurrancy: Curracy.AED.toString(),
    status: this.defaultItemStatus.toString(),
    splittedItems: [] as any,
    quantityDropDownId: 'quantityDropDownId' + uuidv4(),
    statusDropDownId: 'statusDropDownId' + uuidv4(),
    pricePerUnitCurrancyDropDownId: 'pricePerUnitCurrancyDropDownId' + uuidv4(),
    isQuantityError: false,
    quantityErrorMessange: ''
  }

  items = [this.newItemContollers]

  addItem(i?: number, j?: number, k?: number) {
    var newItemController = {
      id: 0,
      parentItemId: 0,
      newInvoiceIds : [] as number[],
      haveBilledChild : false,
      description: new FormControl('', [
        Validators.required
      ]),
      lotNo: new FormControl('', []),
      weightCarats: new FormControl('', [
        Validators.required,
      ]),
      quantityUnit: QuantityUnit.Carats.toString(),
      pricePerUnit: new FormControl('', [
        Validators.required,
      ]),
      pricePerUnitCurrancy: Curracy.AED.toString(),
      status: this.defaultItemStatus.toString(),
      splittedItems: [] as any,
      quantityDropDownId: 'quantityDropDownId' + uuidv4(),
      statusDropDownId: 'statusDropDownId' + uuidv4(),
      pricePerUnitCurrancyDropDownId: 'pricePerUnitCurrancyDropDownId' + uuidv4(),
      isQuantityError: false,
      quantityErrorMessange: ''
    }

    // level - 3
    if (k != null) {
      this.items[i!].splittedItems[j!].splittedItems[k!].splittedItems.push(newItemController)
      this.copyToChild(i, j, k)
      return
    }

    // level - 2
    if (j != null) {
      this.items[i!].splittedItems[j!].splittedItems.push(newItemController)
      this.copyToChild(i, j)
      return
    }

    // level - 1
    if (i != null) {
      this.items[i].splittedItems.push(newItemController)
      this.copyToChild(i)
      return
    }

    // level - 0 
    this.items.push(newItemController)
  }

  removeItem(i: number, j?: number, k?: number, l?: number, force: boolean = false) {
    var item: any
    if (l != null) {
      item = this.items[i].splittedItems[j!].splittedItems[k!].splittedItems[l]
      item.parentItemId = this.items[i].splittedItems[j!].splittedItems[k!].id
      var splittedItems = this.items[i].splittedItems[j!].splittedItems[k!].splittedItems
      if (splittedItems.length <= 2 && !force) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'Minimum 2 items required for splitted item')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      var splittedItems = splittedItems.slice(0, l).concat(splittedItems.slice(l + 1))
      this.items[i].splittedItems[j!].splittedItems[k!].splittedItems = splittedItems
    } else if (k != null) {
      item = this.items[i].splittedItems[j!].splittedItems[k!]
      item.parentItemId = this.items[i].splittedItems[j!].id
     
      var splittedItems = this.items[i].splittedItems[j!].splittedItems
      if (splittedItems.length <= 2 && !force) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'Minimum 2 items required for splitted item')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      for (var x = item.splittedItems.length-1; x >= 0; x--) {
        this.removeItem(i, j, k, x, true)
      }
      var splittedItems = splittedItems.slice(0, k).concat(splittedItems.slice(k + 1))
      this.items[i].splittedItems[j!].splittedItems = splittedItems
    } else if (j != null) {
      item = this.items[i].splittedItems[j!]
      item.parentItemId = this.items[i].id
     
      var splittedItems = this.items[i].splittedItems
      if (splittedItems.length <= 2 && !force) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'Minimum 2 items required for splitted item')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      for (var x = item.splittedItems.length - 1; x >= 0; x--) {
        this.removeItem(i, j, x, undefined, true)
      }
      var splittedItems = splittedItems.slice(0, j).concat(splittedItems.slice(j + 1))
      this.items[i].splittedItems = splittedItems
    } else {
      item = this.items[i]
      for (var x = item.splittedItems.length- 1; x >= 0; x--) {
        this.removeItem(i, x, undefined, undefined, true)
      }
      this.items = this.items.slice(0, i).concat(this.items.slice(i + 1))
    }
    if (item.id != 0) {
      var newItem = {
        approvalId: Number(this.approval!.id!),
        id: Number(item.id!),
        description: item.description.value!,
        lotNo: item.lotNo.value!,
        weightCarats: Number(item.weightCarats.value!),
        quantityUnit: item.quantityUnit,
        pricePerUnit: Number(item.pricePerUnit.value!),
        pricePerUnitCurrancy: item.pricePerUnitCurrancy,
        amount: Number(this.getAmount(item)),
        status: item.status
      } as IItem

      if(item.parentItemId){
        newItem.parentItemId = item.parentItemId
      }
      
      this.itemsToRemove.push(newItem)
    }
  }

  openFloatingDropdown(event: Event, id: string) {
    event.preventDefault();
    this.floatingDropdown.toggeleFloatingDropdown(id)
  }

  selectPricePerCarateCurrency(currancyType: Curracy, i: number, j?: number, k?: number, l?: number) {
    if (l != null) {
      this.items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].pricePerUnitCurrancy = currancyType
      return
    }
    if (k != null) {
      this.items[i].splittedItems[j!].splittedItems[k].pricePerUnitCurrancy = currancyType
      return
    }
    if (j != null) {
      this.items[i].splittedItems[j].pricePerUnitCurrancy = currancyType
      return
    }
    this.items[i].pricePerUnitCurrancy = currancyType
  }

  selectQuantityCategory(quantityCategory: QuantityUnit, i: number, j?: number, k?: number, l?: number) {
    if (l != null) {
      this.items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].quantityUnit = quantityCategory
      return
    }
    if (k != null) {
      this.items[i].splittedItems[j!].splittedItems[k].quantityUnit = quantityCategory
      return
    }
    if (j != null) {
      this.items[i].splittedItems[j].quantityUnit = quantityCategory
      return
    }
    this.items[i].quantityUnit = quantityCategory
  }

  selectStatus(status: ItemStatus, i: number, j?: number, k?: number, l?: number) {
    //level - 3
    if (l != null) {
      if (this.items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].status == ItemStatus.Billed){
        return
      }
      if (this.items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].status == status || status == ItemStatus.Splitted) {
        return
      }
      this.items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].status = status
      return
    }

    //level - 2
    if (k != null) {
      if (this.items[i].splittedItems[j!].splittedItems[k!].status == ItemStatus.Billed){
        return
      }
      if (this.items[i].splittedItems[j!].splittedItems[k].status == status) {
        return
      }
      if (status == ItemStatus.Splitted && this.items[i].splittedItems[j!].splittedItems[k].splittedItems.length == 0) {
        if (this.items[i].splittedItems[j!].splittedItems[k].lotNo.value == null || this.items[i].splittedItems[j!].splittedItems[k].lotNo.value == '') {
          this.msgService.setColor(this.msgBoxId, Color.danger)
          this.msgService.setMsg(this.msgBoxId, 'Enter lot no first')
          this.msgService.openMsgBox(this.msgBoxId)
          return
        }
        var invalidFlag = false
        if (this.items[i].splittedItems[j!].splittedItems[k].description.invalid) {
          this.items[i].splittedItems[j!].splittedItems[k].description.markAsDirty()
          this.items[i].splittedItems[j!].splittedItems[k].description.markAsTouched()
          invalidFlag = true
        }
        if (this.items[i].splittedItems[j!].splittedItems[k].weightCarats.invalid) {
          this.items[i].splittedItems[j!].splittedItems[k].weightCarats.markAsDirty()
          this.items[i].splittedItems[j!].splittedItems[k].weightCarats.markAsTouched()
          invalidFlag = true
        }
        if (this.items[i].splittedItems[j!].splittedItems[k].pricePerUnit.invalid) {
          this.items[i].splittedItems[j!].splittedItems[k].pricePerUnit.markAsDirty()
          this.items[i].splittedItems[j!].splittedItems[k].pricePerUnit.markAsTouched()
          invalidFlag = true
        }
        if (invalidFlag) {
          return
        }

        if (this.items[i].splittedItems[j!].splittedItems[k].splittedItems.length == 0) {
          this.addItem(i, j, k)
          this.addItem(i, j, k)
        }
      } else {
        this.items[i].splittedItems[j!].splittedItems[k].weightCarats.enable()
      }
      this.items[i].splittedItems[j!].splittedItems[k].status = status
      return
    }

    //level - 1
    if (j != null) {
      if (this.items[i].splittedItems[j!].status == ItemStatus.Billed){
        return
      }
      if (this.items[i].splittedItems[j].status == status) {
        return
      }
      if (status == ItemStatus.Splitted) {
        if (this.items[i].splittedItems[j!].lotNo.value == null || this.items[i].splittedItems[j!].lotNo.value == '') {
          this.msgService.setColor(this.msgBoxId, Color.danger)
          this.msgService.setMsg(this.msgBoxId, 'Enter lot no first')
          this.msgService.openMsgBox(this.msgBoxId)
          return
        }
        var invalidFlag = false
        if (this.items[i].splittedItems[j!].description.invalid) {
          this.items[i].splittedItems[j!].description.markAsDirty()
          this.items[i].splittedItems[j!].description.markAsTouched()
          invalidFlag = true
        }
        if (this.items[i].splittedItems[j!].weightCarats.invalid) {
          this.items[i].splittedItems[j!].weightCarats.markAsDirty()
          this.items[i].splittedItems[j!].weightCarats.markAsTouched()
          invalidFlag = true
        }
        if (this.items[i].splittedItems[j!].pricePerUnit.invalid) {
          this.items[i].splittedItems[j!].pricePerUnit.markAsDirty()
          this.items[i].splittedItems[j!].pricePerUnit.markAsTouched()
          invalidFlag = true
        }
        if (invalidFlag) {
          return
        }

        if (this.items[i].splittedItems[j!].splittedItems.length == 0) {
          this.addItem(i, j)
          this.addItem(i, j)
        }
      } else {
        this.items[i].splittedItems[j!].weightCarats.enable()
      }
      this.items[i].splittedItems[j!].status = status
      return
    }

    //level - 0
    if (this.items[i].status == ItemStatus.Billed){
      return
    }
    if (this.items[i].status == status) {
      return
    }
    if (status == ItemStatus.Splitted) {
      if (this.items[i].lotNo.value == null || this.items[i].lotNo.value == '') {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'Enter lot no first')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      var invalidFlag = false
      if (this.items[i].description.invalid) {
        this.items[i].description.markAsDirty()
        this.items[i].description.markAsTouched()
        invalidFlag = true
      }
      if (this.items[i].weightCarats.invalid) {
        this.items[i].weightCarats.markAsDirty()
        this.items[i].weightCarats.markAsTouched()
        invalidFlag = true
      }
      if (this.items[i].pricePerUnit.invalid) {
        this.items[i].pricePerUnit.markAsDirty()
        this.items[i].pricePerUnit.markAsTouched()
        invalidFlag = true
      }
      if (invalidFlag) {
        return
      }

      if (this.items[i].splittedItems.length == 0) {
        this.addItem(i)
        this.addItem(i)
      }
    } else {
      this.items[i].lotNo.enable()
      this.items[i].description.enable()
      this.items[i].weightCarats.enable()
      this.items[i].pricePerUnit.enable()
    }
    this.items[i].status = status
  }

  copyToChild(i?: number, j?: number, k?: number) {
    if (i == null) return;

    const updateChild = (parent, child) => {
      child.lotNo.setValue(parent.lotNo.value);
      child.description.setValue(parent.description.value);
      child.pricePerUnit.setValue(parent.pricePerUnit.value);
      child.quantityUnit = parent.quantityUnit;
      child.pricePerUnitCurrancy = parent.pricePerUnitCurrancy;
      child.lotNo.disable();
      child.description.disable();
      child.pricePerUnit.disable();
    };

    if (k != null) {
      const parent = this.items[i].splittedItems[j!].splittedItems[k];
      parent.splittedItems.forEach(child => {
        updateChild(parent, child);
      });
      if (parent.splittedItems.length > 0) {
        parent.lotNo.disable();
        parent.description.disable();
        parent.weightCarats.disable();
        parent.pricePerUnit.disable();
      }
    } else if (j != null) {
      const parent = this.items[i].splittedItems[j];
      parent.splittedItems.forEach((child, x) => {
        updateChild(parent, child);
        this.copyToChild(i, j, x); // Recursive call with 'x' to handle the next level
      });
      if (parent.splittedItems.length > 0) {
        parent.lotNo.disable();
        parent.description.disable();
        parent.weightCarats.disable();
        parent.pricePerUnit.disable();
      }
    } else {
      const parent = this.items[i];
      parent.splittedItems.forEach((child, x) => {
        updateChild(parent, child);
        this.copyToChild(i, x); // Recursive call with 'x' to handle the next level
      });
      if (parent.splittedItems.length > 0) {
        parent.lotNo.disable();
        parent.description.disable();
        parent.weightCarats.disable();
        parent.pricePerUnit.disable();
      }
    }
  }


  Number(num: string) {
    return Number(num)
  }

  amount(item: any) {
    const amountx = (Number(item.weightCarats.value!) * (item.pricePerUnitCurrancy == this.Currancy.AED ? Number(item.pricePerUnit.value!) : (Number(item.pricePerUnit.value!) * CurrancyConversionRate.USDToAED))).toFixed(2)
    return amountx
  }

  getAmount(item: any) {
    var amountx = 0
    // level - 1
    if (item.status == ItemStatus.Splitted) {
      item.splittedItems.forEach((splittedItem1) => {
        if (splittedItem1.status != ItemStatus.Returned && splittedItem1.status != ItemStatus.Splitted) {
          amountx += Number(this.amount(splittedItem1))
        }
        //level - 2
        if (splittedItem1.status == ItemStatus.Splitted) {
          splittedItem1.splittedItems.forEach((splittedItem2: any) => {
            if (splittedItem2.status != ItemStatus.Returned && splittedItem2.status != ItemStatus.Splitted) {
              amountx += Number(this.amount(splittedItem2))
            }
            //level - 3
            if (splittedItem2.status == ItemStatus.Splitted) {
              splittedItem2.splittedItems.forEach((splittedItem3: any) => {
                if (splittedItem3.status != ItemStatus.Returned && splittedItem3.status != ItemStatus.Splitted) {
                  amountx += Number(this.amount(splittedItem3))
                }
              })
            }
          })
        }
      })
    }

    if (item.status != ItemStatus.Returned && item.status != ItemStatus.Splitted) {
      amountx += Number(this.amount(item))
    }
    return amountx.toFixed(2)
  }

  getReturnedApprovalAmmount(item: any) {
    var amountx = 0
    // level - 1
    if (item.status == ItemStatus.Splitted) {
      item.splittedItems.forEach((splittedItem1) => {
        if (splittedItem1.status != ItemStatus.Splitted) {
          amountx += Number(this.amount(splittedItem1))
        }
        //level - 2
        if (splittedItem1.status == ItemStatus.Splitted) {
          splittedItem1.splittedItems.forEach((splittedItem2: any) => {
            if (splittedItem2.status != ItemStatus.Splitted) {
              amountx += Number(this.amount(splittedItem2))
            }
            //level - 3
            if (splittedItem2.status == ItemStatus.Splitted) {
              splittedItem2.splittedItems.forEach((splittedItem3: any) => {
                if (splittedItem3.status != ItemStatus.Splitted) {
                  amountx += Number(this.amount(splittedItem3))
                }
              })
            }
          })
        }
      })
    }

    if ( item.status != ItemStatus.Splitted) {
      amountx += Number(this.amount(item))
    }
    return amountx.toFixed(2)
  }

  getSubTotal() {
    let subTotal = 0
    this.items.forEach(item => {
      subTotal += Number(this.getAmount(item))
    })

    return subTotal
  }

  getReturnedApprovalSubTotal() {
    let subTotal = 0
    this.items.forEach(item => {
      subTotal += Number(this.getReturnedApprovalAmmount(item))
    })

    return subTotal
  }

  getVat() {
    return Number((this.getSubTotal() * (Vat.vatPr / 100)).toFixed(2))
  }

  getVatString() {
    return this.getVat().toFixed(2)
  }

  getTotal() {
    return Number((this.getSubTotal() + this.getVat()).toFixed(2))
  }

  getTotalString() {
    return this.getTotal().toFixed(2)
  }

  getSubTotalString() {
    return this.getSubTotal().toFixed(2)
  }


  getItemVat(item: IItem) {
    return Number((item.amount * (Vat.vatPr / 100)).toFixed(2))
  }

  getItemTotalWithVat(item: IItem) {
    return Number((item.amount + this.getItemVat(item)).toFixed(2))
  }

  // Save

  async save() {
    if (this.isSaving) {
      return;
    }
    this.isSaving = true
    try {
      var status = await this.saveRecords()
      if (status) {
        this.router.navigate(['approvals'])
      }
    } catch (e) {
      if (environment.isDevMode) {
        console.log(e)
      }
    }
    this.isSaving = false
  }

  async saveAndPreview() {
    if (this.isPreviewing) {
      return;
    }
    this.isPreviewing = true
    try {
      var status = await this.saveRecords()
      if (status) {
        this.router.navigate(['approvals/view', btoa(this.approval!.id!.toString())])
      }
    } catch (e) {
      if (environment.isDevMode) {
        console.log(e)
      }
    }
    this.isPreviewing = false
  }

  getApprovalStatus(){
    var approvalStatus = ApprovalStatus.Returned
    var isPending = false
    var isBilled = false
    this.items.forEach((item) => {
      if (item.status == ItemStatus.Billed) {
        isBilled = true
      }
      else if (item.status == ItemStatus.Pending) {
        isPending = true
      }
      else if(item.status == ItemStatus.Splitted && item.splittedItems.length > 0){
        item.splittedItems.forEach(splittedItem1 =>{
          if(splittedItem1.status == ItemStatus.Billed){
            isBilled = true
          }else if(splittedItem1.status == ItemStatus.Pending) {
            isPending = true
          }else if(splittedItem1.status == ItemStatus.Splitted && splittedItem1.splittedItems.length > 0){
            splittedItem1.splittedItems.forEach(splittedItem2 =>{
              if(splittedItem2.status == ItemStatus.Billed){
                isBilled = true
              }else if(splittedItem2.status == ItemStatus.Pending) {
                isPending = true
              }else if(splittedItem2.status == ItemStatus.Splitted && splittedItem2.splittedItems.length > 0){
                splittedItem2.splittedItems.forEach(splittedItem3 =>{
                  if(splittedItem3.status == ItemStatus.Billed){
                    isBilled = true
                  }else if(splittedItem3.status == ItemStatus.Pending) {
                    isPending = true
                  }
                })
              }
            })
          }
        })
      }
    })
    if (isPending) {
      approvalStatus = ApprovalStatus.Pending
    } else if (isBilled) {
      approvalStatus = ApprovalStatus.Billed
    }

    return approvalStatus
  }

  validateFields(){
    var invalidFlag = false
    // level- 0 
    this.items.forEach((item) => {
      if (item.description.invalid) {
        item.description.markAsDirty()
        item.description.markAsTouched()
        invalidFlag = true
      }
      if (item.weightCarats.invalid) {
        item.weightCarats.markAsDirty()
        item.weightCarats.markAsTouched()
        invalidFlag = true
      }
      if (item.pricePerUnit.invalid) {
        item.pricePerUnit.markAsDirty()
        item.pricePerUnit.markAsTouched()
        invalidFlag = true
      }
      if (item.status == ItemStatus.Splitted) {
        // level - 1
        var quantitySum1 = 0
        item.splittedItems.forEach((splittedItem1) => {
          if (splittedItem1.description.invalid) {
            splittedItem1.description.markAsDirty()
            splittedItem1.description.markAsTouched()
            invalidFlag = true
          }
          if (splittedItem1.weightCarats.invalid) {
            splittedItem1.weightCarats.markAsDirty()
            splittedItem1.weightCarats.markAsTouched()
            invalidFlag = true
          }
          if (splittedItem1.pricePerUnit.invalid) {
            splittedItem1.pricePerUnit.markAsDirty()
            splittedItem1.pricePerUnit.markAsTouched()
            invalidFlag = true
          }
          quantitySum1 += Number(splittedItem1.weightCarats.value)
          if (splittedItem1.status == ItemStatus.Splitted) {
            // level - 2
            var quantitySum2 = 0
            splittedItem1.splittedItems.forEach((splittedItem2) => {
              if (splittedItem2.description.invalid) {
                splittedItem2.description.markAsDirty()
                splittedItem2.description.markAsTouched()
                invalidFlag = true
              }
              if (splittedItem2.weightCarats.invalid) {
                splittedItem2.weightCarats.markAsDirty()
                splittedItem2.weightCarats.markAsTouched()
                invalidFlag = true
              }
              if (splittedItem2.pricePerUnit.invalid) {
                splittedItem2.pricePerUnit.markAsDirty()
                splittedItem2.pricePerUnit.markAsTouched()
                invalidFlag = true
              }
              quantitySum2 += Number(splittedItem2.weightCarats.value)
              if (splittedItem2.status == ItemStatus.Splitted) {
                // level - 3
                var quantitySum3 = 0
                splittedItem2.quantityError = false
                splittedItem2.splittedItems.forEach((splittedItem3) => {
                  if (splittedItem3.description.invalid) {
                    splittedItem3.description.markAsDirty()
                    splittedItem3.description.markAsTouched()
                    invalidFlag = true
                  }
                  if (splittedItem3.weightCarats.invalid) {
                    splittedItem3.weightCarats.markAsDirty()
                    splittedItem3.weightCarats.markAsTouched()
                    invalidFlag = true
                  }
                  if (splittedItem3.pricePerUnit.invalid) {
                    splittedItem3.pricePerUnit.markAsDirty()
                    splittedItem3.pricePerUnit.markAsTouched()
                    invalidFlag = true
                  }
                  quantitySum3 += Number(splittedItem3.weightCarats.value)
                })
                if (quantitySum3 != Number(splittedItem2.weightCarats.value)) {
                  invalidFlag = true
                  splittedItem2.quantityErrorMessange = this.subItemCountError
                  splittedItem2.isQuantityError = true
                }else{
                  splittedItem2.isQuantityError = false
                }
              }
            })
            if (quantitySum2 != Number(splittedItem1.weightCarats.value)) {
              invalidFlag = true
              splittedItem1.quantityErrorMessange = this.subItemCountError
              splittedItem1.isQuantityError = true
            }else{
              splittedItem1.isQuantityError = false
            }
          }
        })
        if (quantitySum1 != Number(item.weightCarats.value)) {
          invalidFlag = true
          item.quantityErrorMessange = this.subItemCountError
          item.isQuantityError = true
        }else{
          item.isQuantityError = false
        }
      }
    })

    return invalidFlag
  }

  async saveRecords() {
    if (this.isSavingRecords) {
      return false
    }
    if (this.selectedCustomer == null) {
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Select customer.')
      this.msgService.openMsgBox(this.msgBoxId)
      return false
    }
    if (this.items.length == 0) {
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Minimum 1 item is required.')
      this.msgService.openMsgBox(this.msgBoxId)
      return false
    }

    if (this.validateFields()) {
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Enter valid value.')
      this.msgService.openMsgBox(this.msgBoxId)
      return false
    }

    this.isSavingRecords = true

    try {
      var ApprovalTobeSaved: IApproval = {
        totalAmount: this.getSubTotal(),
        vat: this.getVat(),
        totalAmountIncludingVat: this.getTotal(),
        customerId: this.selectedCustomer.id!,
        salesmanId: this.user.id,
        status: ApprovalStatus.Pending,
      } as IApproval

      var approval: IApproval = {} as IApproval
      ApprovalTobeSaved.status = this.getApprovalStatus()
      if(ApprovalTobeSaved.status == ApprovalStatus.Returned){
        ApprovalTobeSaved.totalAmount = this.getReturnedApprovalSubTotal()
        ApprovalTobeSaved.vat = Number((ApprovalTobeSaved.totalAmount * Vat.vatPr / 100).toFixed(2))
        ApprovalTobeSaved.totalAmountIncludingVat =  Number((ApprovalTobeSaved.totalAmount + ApprovalTobeSaved.vat).toFixed(2))
      }
      if (this.isUpdate) {
        ApprovalTobeSaved.approvalNo = this.approval!.approvalNo
        ApprovalTobeSaved.id = this.approval!.id
        approval = await new Promise(resolve => {
          this.approvalService.update(ApprovalTobeSaved).pipe(
            take(1)
          ).subscribe(
            (response) => {
              if (response.isSuccess) {
                resolve(response.data)
              } else {
                this.msgService.setColor(this.msgBoxId, Color.danger)
                if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
                  this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
                } else {
                  this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
                }
                this.msgService.openMsgBox(this.msgBoxId)
              }
            },
            (error) => {
              this.router.navigate(['/approvals'])
            }
          )
        })
      } else {
        approval = await new Promise(resolve => {
          this.approvalService.create(ApprovalTobeSaved).pipe(
            take(1)
          ).subscribe(
            (response) => {
              if (response.isSuccess) {
                resolve(response.data)
              } else {
                this.msgService.setColor(this.msgBoxId, Color.danger)
                if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
                  this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
                } else {
                  this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
                }
                this.msgService.openMsgBox(this.msgBoxId)
              }
            },
            (error) => {
              this.router.navigate(['/approvals'])
            }
          )
        })
      }

      var itemsToBeCreated: IItem[] = []
      var itemsToBeUpdated: IItem[] = []

      // level - 0
      this.items.forEach((item, i) => {
        var newItem = {
          approvalId: approval.id!,
          newInvoiceIds : item.newInvoiceIds,
          description: item.description.value!,
          lotNo: item.lotNo.value!,
          weightCarats: Number(item.weightCarats.value!),
          quantityUnit: item.quantityUnit,
          pricePerUnit: Number(item.pricePerUnit.value!),
          pricePerUnitCurrancy: item.pricePerUnitCurrancy,
          amount: Number(this.amount(item)),
          status: item.status,
          splittedItems: [] as IItem[]
        } as IItem

        // level - 1
        item.splittedItems.forEach((splittedItem1, j) => {
            if (item.status != ItemStatus.Splitted) {
              this.removeItem(i, item.splittedItems.length - 1, undefined,undefined, true)
              return
            }
            var newItem1 = {
              approvalId: approval.id!,
              newInvoiceIds : splittedItem1.newInvoiceIds,
              description: splittedItem1.description.value!,
              lotNo: splittedItem1.lotNo.value!,
              weightCarats: Number(splittedItem1.weightCarats.value!),
              quantityUnit: splittedItem1.quantityUnit,
              pricePerUnit: Number(splittedItem1.pricePerUnit.value!),
              pricePerUnitCurrancy: splittedItem1.pricePerUnitCurrancy,
              amount: Number(this.amount(splittedItem1)),
              status: splittedItem1.status,
              splittedItems: [] as IItem[]
            } as IItem

            newItem1.vat = this.getItemVat(newItem1),
              newItem1.amountIncludingVat = this.getItemTotalWithVat(newItem1)
            //level - 2
              splittedItem1.splittedItems.forEach((splittedItem2, k) => {
                if (splittedItem1.status != ItemStatus.Splitted) {
                  this.removeItem(i, j,  splittedItem1.splittedItems.length - 1, undefined, true)
                  return
                }
                var newItem2 = {
                  approvalId: approval.id!,
                  newInvoiceIds : splittedItem2.newInvoiceIds,
                  description: splittedItem2.description.value!,
                  lotNo: splittedItem2.lotNo.value!,
                  weightCarats: Number(splittedItem2.weightCarats.value!),
                  quantityUnit: splittedItem2.quantityUnit,
                  pricePerUnit: Number(splittedItem2.pricePerUnit.value!),
                  pricePerUnitCurrancy: splittedItem2.pricePerUnitCurrancy,
                  amount: Number(this.amount(splittedItem2)),
                  status: splittedItem2.status,
                  splittedItems: [] as IItem[]
                } as IItem
                newItem2.vat = this.getItemVat(newItem2),
                  newItem2.amountIncludingVat = this.getItemTotalWithVat(newItem2)

                //level - 3
                  splittedItem2.splittedItems.forEach((splittedItem3, l) => {
                    if (splittedItem2.status != ItemStatus.Splitted) {
                      this.removeItem(i, j, k,splittedItem2.splittedItems.length - 1, true)
                      return
                    }
                    var newItem3 = {
                      approvalId: approval.id!,
                      newInvoiceIds : splittedItem3.newInvoiceIds,
                      description: splittedItem3.description.value!,
                      lotNo: splittedItem3.lotNo.value!,
                      weightCarats: Number(splittedItem3.weightCarats.value!),
                      quantityUnit: splittedItem3.quantityUnit,
                      pricePerUnit: Number(splittedItem3.pricePerUnit.value!),
                      pricePerUnitCurrancy: splittedItem3.pricePerUnitCurrancy,
                      amount: Number(this.amount(splittedItem3)),
                      status: splittedItem3.status,
                    } as IItem
                    newItem3.vat = this.getItemVat(newItem1),
                      newItem3.amountIncludingVat = this.getItemTotalWithVat(newItem3)
                    if (splittedItem2.id != 0) {
                      newItem3.parentItemId = splittedItem2.id
                      if (splittedItem3.id != 0) {
                        newItem3.id = splittedItem3.id
                        newItem3.approval = undefined
                        itemsToBeUpdated.push(newItem3)
                      } else {
                        itemsToBeCreated.push(newItem3)
                      }
                    } else {
                      newItem2.splittedItems!.push(newItem3)
                    }
                  })
                

                if (splittedItem1.id != 0) {
                  newItem2.parentItemId = splittedItem1.id
                  if (splittedItem2.id != 0) {
                    newItem2.id = splittedItem2.id
                    newItem2.approval = undefined
                    itemsToBeUpdated.push(newItem2)
                  } else {
                    itemsToBeCreated.push(newItem2)
                  }
                } else {
                  newItem1.splittedItems!.push(newItem2)
                }

              })
            if (item.id != 0) {
              newItem1.parentItemId = item.id
              if (splittedItem1.id != 0) {
                newItem1.id = splittedItem1.id
                newItem1.approval = undefined
                itemsToBeUpdated.push(newItem1)
              } else {
                itemsToBeCreated.push(newItem1)
              }
            } else {
              newItem.splittedItems!.push(newItem1)
            }
          })
        

        newItem.vat = this.getItemVat(newItem),
          newItem.amountIncludingVat = this.getItemTotalWithVat(newItem)

        if (this.isUpdate) {
          if (item.id != 0) {
            newItem.id = item.id
            newItem.approval = undefined
            itemsToBeUpdated.push(newItem)
          } else {
            itemsToBeCreated.push(newItem)
          }
        } else {
          itemsToBeCreated.push(newItem)
        }
      })

      const map = {}
      const roots = [] as any

      console.log(this.itemsToRemove)
      this.itemsToRemove.forEach(item=>{
        map[item.id!] = item
        item.splittedItems = [] 
      })

      this.itemsToRemove.forEach(item=>{
        if(item.parentItemId != null){
          if(map[item.parentItemId]){
            map[item.parentItemId].splittedItems!.push(item)
          }else{
            roots.push(item)
          }
        }else{
          roots.push(item)
        }
      })

      this.itemsToRemove = roots
      console.log(roots)

      if (this.itemsToRemove.length != 0) {
        await new Promise(resolve => {
          this.itemService.deleteRange(this.itemsToRemove ).pipe(
            take(1)
          ).subscribe(
            response => {
              if (response.isSuccess) {
                resolve(0)
              } else {
                this.msgService.setColor(this.msgBoxId, Color.danger)
                if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
                  this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
                } else {
                  this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
                }
                this.msgService.openMsgBox(this.msgBoxId)
                resolve(0)
              }
            })
        })
      }

      if (itemsToBeCreated.length != 0) {

        await new Promise(resolve => {
          this.itemService.createRange(itemsToBeCreated).pipe(
            take(1)
          ).subscribe(
            response => {
              if (response.isSuccess) {
                resolve(0)
              } else {
                this.msgService.setColor(this.msgBoxId, Color.danger)
                if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
                  this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
                } else {
                  this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
                }
                this.msgService.openMsgBox(this.msgBoxId)
                resolve(0)
              }
            })
        })
      }
      if (this.isUpdate && itemsToBeUpdated.length != 0) {
        await new Promise(resolve => {
          this.itemService.updateRange(itemsToBeUpdated).pipe(
            take(1)
          ).subscribe(
            response => {
              if (response.isSuccess) {
                resolve(0)
              } else {
                this.msgService.setColor(this.msgBoxId, Color.danger)
                if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
                  this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
                } else {
                  this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
                }
                this.msgService.openMsgBox(this.msgBoxId)
                resolve(0)
              }
            })
        })
      }


      this.approval = approval
      this.msgService.setColor(this.msgBoxId, Color.success)
      if (this.isUpdate) {
        this.msgService.setMsg(this.msgBoxId, 'Approval updated successfully.')
      } else {
        this.msgService.setMsg(this.msgBoxId, 'Approval created successfully.')
      }
      this.msgService.openMsgBox(this.msgBoxId)
      this.isSavingRecords = false
      return true
    } catch (e) {
      if (environment.isDevMode) {
        console.log(e)
      };
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Something is wrong, Try again later.')
      this.msgService.openMsgBox(this.msgBoxId)
      this.isSavingRecords = false
      return false
    }

  }


  // delete
  deleteApproval(entity: IApproval) {
    this.alertService.setAlert({
      title: `Are you sure you want to delete approval #${entity.approvalNo}`,
      msg: 'Note: You will be not able to recover the approval.',
      okBtnColor: Color.danger,
      okBtnText: BtnText.delete,
      cancelBtnText: BtnText.cancel
    })
    this.alertService.onActionClicked.pipe(first()).subscribe(async value => {
      if (value) {
        this.isDeleting = true

        if (entity.status == ApprovalStatus.Billed) {
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
                this.isDeleting = false

                this.router.navigate(['approvals'])
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
          this.isDeleting = false
        }
      }
    })
  }


  // create customer
  openAddCustomerForm(event: Event) {
    event.preventDefault()
    this.floatingModal.openFloatingModal(this.addCustomerModalId)
    this.customerAddForm.reset()
    this.cdr.detectChanges();
  }

  async createCustomer() {
    if (
      this.customerAddForm.valid
    ) {
      this.isCreatingUser = true
      try {
        this.customerService.create(
          {
            name: this.newName.value!,
            email: this.newEmail.value! ?? '',
            trn: this.newTRN.value ?? '',
            phone: this.newPhone.value!,
            address: this.newAddress.value ?? ''
          }
        ).subscribe(
          (response) => {
            if (response.isSuccess) {
              var newCustomer: ICustomer = response.data
              this.selectCustomer(newCustomer)
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

  // Get Customer
  async getCustomers() {
    try {
      var params: any = {
        search: this.searchString,
        orderBy: CustomerFields.createDate,
        order: Order.DESC,
        pageSize: 50,
        pageNo: 1,
      }
      this.customerService.getAll(params).subscribe(
        (response) => {
          if (response.isSuccess) {
            this.customersSelectOptions = response!.data.records
          } else {
            this.msgService.setColor(this.msgBoxId, Color.danger)
            if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
              this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
            } else {
              this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
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

  // search 
  filterData(event: Event) {
    event.preventDefault();
    var searchInputField = event.target as HTMLInputElement
    if (this.searchString == searchInputField.value) {
      return
    }
    this.searchString = searchInputField.value
    this.inputSearch.next(this.searchString)
  }

}
