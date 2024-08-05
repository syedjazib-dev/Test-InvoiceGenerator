import { HttpParams } from '@angular/common/http';
import { ChangeDetectorRef, Component, CSP_NONCE, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, defaultIfEmpty, first, take } from 'rxjs';
import IApproval from 'src/app/models/approval.model';
import ICustomer from 'src/app/models/customer.model';
import IInvoice from 'src/app/models/invoice.model';
import IItem from 'src/app/models/item.model';
import IUser from 'src/app/models/user.model';
import { AlertService } from 'src/app/services/alert.service';
import { ApprovalService } from 'src/app/services/approval.service';
import { CustomerService } from 'src/app/services/customer.service';
import { FloatingDropdownService } from 'src/app/services/floating-dropdown.service';
import { FloatingModalService } from 'src/app/services/floating-modal.service';
import { InvoiceService } from 'src/app/services/invoice.service';
import { ItemService } from 'src/app/services/item.service';
import { MsgService } from 'src/app/services/msg.service';
import { BtnText } from 'src/assets/static_data/BtnText';
import { Color } from 'src/assets/static_data/Color';
import { CurrancyConversionRate } from 'src/assets/static_data/CurrancyConversionRate';
import { Curracy } from 'src/assets/static_data/Currency';
import { ApprovalFields } from 'src/assets/static_data/Fields/ApprovalFields';
import { CustomerFields } from 'src/assets/static_data/Fields/CustomerFields';
import { Order } from 'src/assets/static_data/Order';
import { QuantityUnit } from 'src/assets/static_data/QuatityCategory';
import { ApprovalStatus } from 'src/assets/static_data/Status/ApprovalStatus';
import { InvoiceStatus } from 'src/assets/static_data/Status/InvoiceStatus';
import { ItemStatus } from 'src/assets/static_data/Status/ItemStatus';
import { Vat } from 'src/assets/static_data/vat';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-new-invoice',
  templateUrl: './new-invoice.component.html',
  styleUrls: ['./new-invoice.component.css']
})
export class NewInvoiceComponent implements OnInit {

  user: IUser = {} as IUser
  constructor(
    private floatingDropdown: FloatingDropdownService,
    private customerService: CustomerService,
    private approvalService: ApprovalService,
    private invoiceService: InvoiceService,
    private itemService: ItemService,
    private msgService: MsgService,
    private route: ActivatedRoute,
    private router: Router,
    private floatingModal: FloatingModalService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {

    this.route.parent!.parent!.data.subscribe(data => {
      this.user = data['user'];
    });

    this.route.data.subscribe(data => {
      this.invoice = data['invoice']
      this.invoiceItems = data['invoiceItems']

      if (this.invoice && this.invoiceItems) {
        this.invoiceApprovals = []
        this.invoice!.invoiceApprovals!.forEach(invocieApproval => {
          this.invoiceApprovals!.push(invocieApproval.approval)
        })
        this.isUpdate = true
        this.init()
      }
    });
  }

  invoice: IInvoice | null = null
  invoiceApprovals: IApproval[] | null = []
  invoiceItems: IItem[] | null = null
  customerInputSearch = new Subject<string>();
  approvalInputSearch = new Subject<string>();
  customerFilterText: string = ""
  approvalFilterText: string = ""
  isCreatingUser = false
  isUpdate = false
  isImporting = false

  init() {
    console.log(this.isUpdate)
    this.selectCustomer(this.invoice!.customer!)

    var invoiceItemWithOutApproval = this.invoiceItems!.filter(item => {
      return (!item.approvalId) || item.approvalId == 0
    })

    var invoiceItemWithApproval = this.invoiceItems!.filter(item => {
      return item.approvalId && item.approvalId != 0
    })

    //approval item set
    const approvalItemMap = {}
    const approvalItemRoots = [] as any
    invoiceItemWithApproval!.forEach(item => {
      var invoiceIds: number[] = []
      if (item.invoiceItems != null) {
        item.invoiceItems.forEach(invoiceItem => {
          if (item.id == invoiceItem.itemId) {
            invoiceIds.push(invoiceItem.invoiceId)
          }
        })
      }
      item.newInvoiceIds = invoiceIds
      approvalItemMap[item.id!] = item
      item.splittedItems = []
    })

    console.log(invoiceItemWithApproval)
    invoiceItemWithApproval!.forEach(item => {
      if (item.parentItemId !== null) {
        if (approvalItemMap[item.parentItemId!]) {
          approvalItemMap[item.parentItemId!].splittedItems.push(item);
        }
      } else {
        approvalItemRoots.push(item);
      }
    })

    this.importedapprovalsList = []
    this.invoiceApprovals!.forEach((approval) => {
      var NewImpotedApproval: any = {
        approval: approval,
        items: [] as any
      }


      console.log('approvalItemRoots')
      console.log(approvalItemRoots)
      approvalItemRoots.forEach(item => {
        if (item.approvalId == approval.id) {
          var newItem = {
            id: 0,
            newInvoiceIds: [] as number[],
            defaultSplitted: false,
            parentItemId: 0,
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
          console.log(newItem.defaultSplitted)
          newItem.splittedItems = []
          if (item.parentItemId != null) {
            newItem.parentItemId = item.parentItemId!
          }

          //level - 1
          if (item.status == ItemStatus.Splitted) {
            newItem.defaultSplitted = true
          }
          newItem.lotNo.disable()
          newItem.description.disable()
          newItem.weightCarats.disable()
          newItem.pricePerUnit.disable()
          item.splittedItems!.forEach(splittedItem1 => {
            var newItem1 = {
              id: 0,
              newInvoiceIds: [] as number[],
              defaultSplitted: false,
              parentItemId: 0,
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

            if (splittedItem1.parentItemId != null) {
              newItem1.parentItemId = splittedItem1.parentItemId!
            }

            if (splittedItem1.status == ItemStatus.Splitted) {
              newItem1.defaultSplitted = true
            }
            newItem1.lotNo.disable()
            newItem1.description.disable()
            newItem1.weightCarats.disable()
            newItem1.pricePerUnit.disable()

            //level- 2
            splittedItem1.splittedItems!.forEach(splittedItem2 => {
              var newItem2 = {
                id: 0,
                newInvoiceIds: [] as number[],
                defaultSplitted: false,
                parentItemId: 0,
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
              if (splittedItem2.parentItemId != null) {
                newItem2.parentItemId = splittedItem2.parentItemId!
              }
              if (splittedItem2.status == ItemStatus.Splitted) {
                newItem2.defaultSplitted = true
              }
              newItem2.lotNo.disable()
              newItem2.description.disable()
              newItem2.weightCarats.disable()
              newItem2.pricePerUnit.disable()

              //level - 3
              splittedItem2.splittedItems!.forEach(splittedItem3 => {
                var newItem3 = {
                  id: 0,
                  newInvoiceIds: [] as number[],
                  parentItemId: 0,
                  defaultSplitted: false,
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
                newItem3.defaultSplitted = false
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
                newItem3.weightCarats.disable()
                if (splittedItem3.parentItemId != null) {
                  newItem3.parentItemId = splittedItem3.parentItemId!
                }

                newItem2.splittedItems.push(newItem3)
              })

              newItem1.splittedItems.push(newItem2)
            })

            newItem.splittedItems.push(newItem1)

          })

          NewImpotedApproval.items.push(newItem)
          console.log(newItem)
          this.itemToBeRemoveInvoiceId.push(item)
        }

      })

      this.importedapprovalsList.push(NewImpotedApproval)
    })

    console.log(this.importedapprovalsList)


    // invoice item set
    this.items = []
    const invoiceItemmap = {}
    const invoiceItemroots = [] as any
    invoiceItemWithOutApproval!.forEach(item => {
      var invoiceIds: number[] = []
      if (item.invoiceItems != null) {
        item.invoiceItems.forEach(invoiceItem => {
          if (item.id == invoiceItem.itemId) {
            invoiceIds.push(invoiceItem.invoiceId)
          }
        })
      }
      item.newInvoiceIds = invoiceIds
      invoiceItemmap[item.id!] = item
      item.splittedItems = []
    })
    invoiceItemWithOutApproval!.forEach(item => {
      if (item.parentItemId !== null) {
        if (invoiceItemmap[item.parentItemId!]) {
          invoiceItemmap[item.parentItemId!].splittedItems.push(item);
        }
      } else {
        invoiceItemroots.push(item);
      }
    })

    console.log('invoiceItemroots')
    console.log(invoiceItemroots)

    invoiceItemroots.forEach(item => {
      var newItem = {
        id: 0,
        newInvoiceIds: [] as number[],
        parentItemId: 0,
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
          newInvoiceIds: [] as number[],
          parentItemId: 0,
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
            newInvoiceIds: [] as number[],
            parentItemId: 0,
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
              newInvoiceIds: [] as number[],
              parentItemId: 0,
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

            newItem2.splittedItems.push(newItem3)
          })

          newItem1.splittedItems.push(newItem2)
        })

        newItem.splittedItems.push(newItem1)

      })

      this.items.push(newItem)

    })
  }

  ngOnInit(): void {
    this.getCustomers()
    this.customerInputSearch.pipe(debounceTime(1000)).subscribe(searchString => {
      this.getCustomers()
    });
    this.approvalInputSearch.pipe(debounceTime(1000)).subscribe(searchString => {
      this.getApprovals()
    });
    this.email.disable()
    this.trn.disable()
    this.address.disable()
    this.phone.disable()
  }

  msgBoxId = 'appMsg'
  customerFloatingDropdownId = 'customerFloatingDropdownId'
  approvalFloatingDropdownId = 'approvalFloatingDropdownId'
  addCustomerModalId = 'addCustomerModalId'
  subItemCountError = 'sub-item quantities don\'t match the expected value.'

  customerSearchString = ''
  approvalSearchString = ''
  isSaving = false
  isSavingRecords = false
  isPreviewing = false
  isDeleting = false

  ItemStatus = ItemStatus

  itemsToRemove: IItem[] = []

  approvalsToUnbill: IApproval[] = []

  CurracySelectOptions = [
    Curracy.AED,
    Curracy.USD
  ]

  quatityCategorySelectOptions = [
    QuantityUnit.Carats,
    QuantityUnit.Pices
  ]

  customersSelectOptions: ICustomer[] = []
  approvalSelectOptions: IApproval[] = []
  selectedCustomer: ICustomer | null = null
  selectedApproval: IApproval | null = null

  selectCustomer(customer: ICustomer) {
    if (this.selectedCustomer != null && customer.id != this.selectedCustomer.id!) {
      this.importedapprovalsList.forEach((approval) => {
        this.approvalsToUnbill.push(approval.approval)
        approval.items.forEach((item) => {
          if (item.status == ItemStatus.Billed)
            this.itemToBeRemoveInvoiceId.push(item)
        })

        this.itemsToRemove = this.itemsToRemove.filter((item) => {
          if (item.approvalId && item.approvalId != undefined) {
            return item.approvalId != approval.approval.id
          } else {
            return false
          }
        })

      })
      this.importedapprovalsList = []
    }
    this.selectedCustomer = customer
    this.phone.setValue(this.selectedCustomer.phone)
    this.email.setValue(this.selectedCustomer.email!)
    this.trn.setValue(this.selectedCustomer.trn!)
    this.address.setValue(this.selectedCustomer.address!)
    this.getApprovals()
  }

  selectApproval(approval: IApproval) {
    if (this.isImporting) {
      return
    }
    this.selectedApproval = approval
  }

  Currancy = Curracy
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

  isPaid = new FormControl('', [])
  PaymentDateControl = new FormControl('', [])

  customerAddForm = new FormGroup({
    name: this.newName,
    email: this.newEmail,
    trn: this.newTRN,
    phone: this.newPhone,
    address: this.newAddress
  })

  defaultItemStatus = ItemStatus.AddedToBill
  itemStatusOptions = [
    ItemStatus.AddedToBill,
    ItemStatus.Pending,
    ItemStatus.Splitted,
    ItemStatus.Returned,
  ]


  newItemContollers = {
    id: 0,
    newInvoiceIds: [] as number[],
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

  newApprovalControllers = {
    approval: {} as IApproval,
    items: [{
      id: 0,
      newInvoiceIds: [] as number[],
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
    }]
  }

  items = [this.newItemContollers]
  importedapprovalsList: any = []
  itemToBeRemoveInvoiceId: IItem[] = []

  addItem(i?: number, j?: number, k?: number) {
    var newItemController = {
      id: 0,
      newInvoiceIds: [] as number[],
      parentItemId: 0,
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

  addItemToApproval(approvalIndex: number, i?: number, j?: number, k?: number) {
    var newItemController = {
      id: 0,
      newInvoiceIds: [] as number[],
      parentItemId: 0,
      defaultSplitted: false,
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
      this.importedapprovalsList[approvalIndex].items[i!].splittedItems[j!].splittedItems[k!].splittedItems.push(newItemController)
      this.copyToChildApproval(approvalIndex, i, j, k)
      return
    }

    // level - 2
    if (j != null) {
      this.importedapprovalsList[approvalIndex].items[i!].splittedItems[j!].splittedItems.push(newItemController)
      this.copyToChildApproval(approvalIndex, i, j)
      return
    }

    // level - 1
    if (i != null) {
      this.importedapprovalsList[approvalIndex].items[i].splittedItems.push(newItemController)
      this.copyToChildApproval(approvalIndex, i)
      return
    }

    // level - 0 
    this.importedapprovalsList[approvalIndex].items.push(newItemController)
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

  copyToChildApproval(approvalIndex: number, i?: number, j?: number, k?: number) {
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
      const parent = this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k];
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
      const parent = this.importedapprovalsList[approvalIndex].items[i].splittedItems[j];
      parent.splittedItems.forEach((child, x) => {
        updateChild(parent, child);
        this.copyToChildApproval(approvalIndex, i, j, x); // Recursive call with 'x' to handle the next level
      });
      if (parent.splittedItems.length > 0) {
        parent.lotNo.disable();
        parent.description.disable();
        parent.weightCarats.disable();
        parent.pricePerUnit.disable();
      }
    } else {
      const parent = this.importedapprovalsList[approvalIndex].items[i];
      parent.splittedItems.forEach((child, x) => {
        updateChild(parent, child);
        this.copyToChildApproval(approvalIndex, i, x); // Recursive call with 'x' to handle the next level
      });
      if (parent.splittedItems.length > 0) {
        parent.lotNo.disable();
        parent.description.disable();
        parent.weightCarats.disable();
        parent.pricePerUnit.disable();
      }
    }
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
      for (var x = item.splittedItems.length - 1; x >= 0; x--) {
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
      for (var x = item.splittedItems.length - 1; x >= 0; x--) {
        this.removeItem(i, x, undefined, undefined, true)
      }
      this.items = this.items.slice(0, i).concat(this.items.slice(i + 1))
    }

    if (item.id != 0) {
      var invoiceId = this.invoice!.id
      var newInvoiceIds = item.newInvoiceIds.filter(id => id != invoiceId)
      var newItem = {
        id: Number(item.id!),
        newInvoiceIds: newInvoiceIds,
        description: item.description.value!,
        lotNo: item.lotNo.value!,
        weightCarats: Number(item.weightCarats.value!),
        quantityUnit: item.quantityUnit,
        pricePerUnit: Number(item.pricePerUnit.value!),
        pricePerUnitCurrancy: item.pricePerUnitCurrancy,
        amount: Number(this.getAmount(item)),
        status: item.status
      } as IItem

      if (item.parentItemId) {
        newItem.parentItemId = item.parentItemId
      }

      this.itemsToRemove.push(newItem)
    }
  }

  removeItemFromApproval(approvalIndex: number, i: number, j?: number, k?: number, l?: number, force: boolean = false) {
    var item: any
    if (l != null) {
      item = this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].splittedItems[l]
      item.parentItemId = this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].id
      var splittedItems = this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].splittedItems
      if (item.defaultSplitted) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'You can remove this item from approval only')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      if (splittedItems.length <= 2 && !force) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'Minimum 2 items required for splitted item')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      var splittedItems = splittedItems.slice(0, l).concat(splittedItems.slice(l + 1))
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].splittedItems = splittedItems
    } else if (k != null) {
      item = this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!]
      item.parentItemId = this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].id
      if (item.defaultSplitted) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'You can remove this item from approval only')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      var splittedItems = this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems
      if (splittedItems.length <= 2 && !force) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'Minimum 2 items required for splitted item')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      for (var x = item.splittedItems.length - 1; x >= 0; x--) {
        this.removeItem(i, j, k, x, true)
      }
      var splittedItems = splittedItems.slice(0, k).concat(splittedItems.slice(k + 1))
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems = splittedItems
    } else if (j != null) {
      item = this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!]
      item.parentItemId = this.importedapprovalsList[approvalIndex].items[i].id
      if (item.defaultSplitted) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'You can remove this item from approval only')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      var splittedItems = this.importedapprovalsList[approvalIndex].items[i].splittedItems
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
      this.importedapprovalsList[approvalIndex].items[i].splittedItems = splittedItems
    } else {
      item = this.importedapprovalsList[approvalIndex].items[i]
      if (item.defaultSplitted) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'You can remove this item from approval only')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      if (this.importedapprovalsList[approvalIndex].items.length == 1) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'Minimun 1 item is required in approval.')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      for (var x = item.splittedItems.length - 1; x >= 0; x--) {
        this.removeItem(i, x, undefined, undefined, true)
      }
      this.importedapprovalsList[approvalIndex].items = this.importedapprovalsList[approvalIndex].items.slice(0, i).concat(this.importedapprovalsList[approvalIndex].items.slice(i + 1))
    }


    if (item.id != 0) {
      var invoiceId = this.invoice!.id
      var newInvoiceIds = item.newInvoiceIds.filter(id => id != invoiceId)
      var newItem = {
        id: Number(item.id!),
        newInvoiceIds: newInvoiceIds,
        description: item.description.value!,
        lotNo: item.lotNo.value!,
        weightCarats: Number(item.weightCarats.value!),
        quantityUnit: item.quantityUnit,
        pricePerUnit: Number(item.pricePerUnit.value!),
        pricePerUnitCurrancy: item.pricePerUnitCurrancy,
        amount: Number(this.getAmount(item)),
        status: item.status
      } as IItem

      if (item.parentItemId) {
        newItem.parentItemId = item.parentItemId
      }

      this.itemsToRemove.push(newItem)
    }
  }

  removeImportedApproval(approvalIndex: number) {
    var approval = this.importedapprovalsList[approvalIndex].approval as IApproval
    var items = this.importedapprovalsList[approvalIndex].items
    this.importedapprovalsList = this.importedapprovalsList.slice(0, approvalIndex).concat(this.importedapprovalsList.slice(approvalIndex + 1))
    this.approvalSelectOptions = this.approvalSelectOptions.filter(approvalOpt => approval.id != approvalOpt.id)

    this.approvalSelectOptions.push(approval)

    if (approval.status == ApprovalStatus.Billed) {
      this.approvalsToUnbill.push(approval)
    }

    this.itemsToRemove = this.itemsToRemove.filter((item) => {
      if (item.approvalId && item.approvalId != undefined) {
        return item.approvalId != approval.id
      } else {
        return false
      }
    })

    this.msgService.setColor(this.msgBoxId, Color.success)
    this.msgService.setMsg(this.msgBoxId, 'Approval removed successfully.')
    this.msgService.openMsgBox(this.msgBoxId)
  }

  openFloatingDropdown(event: Event, id: string) {
    event.preventDefault();
    this.floatingDropdown.toggeleFloatingDropdown(id)
  }

  selectPricePerCarateCurrencyApproval(currancyType: Curracy, approvalIndex: number, i: number, j?: number, k?: number, l?: number) {
    if (l != null) {
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].pricePerUnitCurrancy = currancyType
      return
    }
    if (k != null) {
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].pricePerUnitCurrancy = currancyType
      return
    }
    if (j != null) {
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j].pricePerUnitCurrancy = currancyType
      return
    }
    this.importedapprovalsList[approvalIndex].items[i].pricePerUnitCurrancy = currancyType
  }

  selectQuantityCategoryApproval(quantityUnit: QuantityUnit, approvalIndex: number, i: number, j?: number, k?: number, l?: number) {
    if (l != null) {
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].quantityUnit = quantityUnit
      return
    }
    if (k != null) {
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].quantityUnit = quantityUnit
      return
    }
    if (j != null) {
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j].quantityUnit = quantityUnit
      return
    }
    this.importedapprovalsList[approvalIndex].items[i].quantityUnit = quantityUnit
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

  selectQuantityCategory(quantityUnit: QuantityUnit, i: number, j?: number, k?: number, l?: number) {
    if (l != null) {
      this.items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].quantityUnit = quantityUnit
      return
    }
    if (k != null) {
      this.items[i].splittedItems[j!].splittedItems[k].quantityUnit = quantityUnit
      return
    }
    if (j != null) {
      this.items[i].splittedItems[j].quantityUnit = quantityUnit
      return
    }
    this.items[i].quantityUnit = quantityUnit
  }

  selectStatus(status: ItemStatus, i: number, j?: number, k?: number, l?: number) {
    if(status == ItemStatus.Pending){
      return
    }
    //level - 3
    if (l != null) {
      if (this.items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].status == status || status == ItemStatus.Splitted) {
        return
      }
      this.items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].status = status
      return
    }

    //level - 2
    if (k != null) {
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

  selectStatusApproval(status: ItemStatus, approvalIndex: number, i: number, j?: number, k?: number, l?: number) {
    //level - 3
    if (l != null) {
      if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].status == status || status == ItemStatus.Splitted) {
        console.log('return')
        return
      }
      if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].defaultSplitted) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'You can edit this item from approval only.')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].status = status
      console.log(this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].splittedItems[l].status)
      return
    }

    //level - 2
    if (k != null) {
      if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].status == status) {
        return
      }
      if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k!].defaultSplitted) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'You can edit this item from approval only.')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      if (status == ItemStatus.Splitted && this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].splittedItems.length == 0) {
        if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].lotNo.value == null || this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].lotNo.value == '') {
          this.msgService.setColor(this.msgBoxId, Color.danger)
          this.msgService.setMsg(this.msgBoxId, 'Enter lot no first')
          this.msgService.openMsgBox(this.msgBoxId)
          return
        }
        var invalidFlag = false
        if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].description.invalid) {
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].description.markAsDirty()
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].description.markAsTouched()
          invalidFlag = true
        }
        if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].weightCarats.invalid) {
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].weightCarats.markAsDirty()
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].weightCarats.markAsTouched()
          invalidFlag = true
        }
        if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].pricePerUnit.invalid) {
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].pricePerUnit.markAsDirty()
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].pricePerUnit.markAsTouched()
          invalidFlag = true
        }
        if (invalidFlag) {
          return
        }

        if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].splittedItems.length == 0) {
          this.addItemToApproval(approvalIndex, i, j, k)
          this.addItemToApproval(approvalIndex, i, j, k)
        }
      } else {
        this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].weightCarats.enable()
      }
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems[k].status = status
      return
    }

    //level - 1
    if (j != null) {
      if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j].status == status) {
        return
      }
      if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].defaultSplitted) {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'You can edit this item from approval only.')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      if (status == ItemStatus.Splitted) {
        if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].lotNo.value == null || this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].lotNo.value == '') {
          this.msgService.setColor(this.msgBoxId, Color.danger)
          this.msgService.setMsg(this.msgBoxId, 'Enter lot no first')
          this.msgService.openMsgBox(this.msgBoxId)
          return
        }
        var invalidFlag = false
        if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].description.invalid) {
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].description.markAsDirty()
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].description.markAsTouched()
          invalidFlag = true
        }
        if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].weightCarats.invalid) {
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].weightCarats.markAsDirty()
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].weightCarats.markAsTouched()
          invalidFlag = true
        }
        if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].pricePerUnit.invalid) {
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].pricePerUnit.markAsDirty()
          this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].pricePerUnit.markAsTouched()
          invalidFlag = true
        }
        if (invalidFlag) {
          return
        }

        if (this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].splittedItems.length == 0) {
          this.importedapprovalsList[approvalIndex].addItemToApproval(approvalIndex, i, j)
          this.importedapprovalsList[approvalIndex].addItemToApproval(approvalIndex, i, j)
        }
      } else {
        this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].weightCarats.enable()
      }
      this.importedapprovalsList[approvalIndex].items[i].splittedItems[j!].status = status
      return
    }

    //level - 0
    if (this.importedapprovalsList[approvalIndex].items[i].status == status) {
      return
    }
    console.log(this.importedapprovalsList[approvalIndex].items[i].defaultSplitted)
    if (this.importedapprovalsList[approvalIndex].items[i].defaultSplitted) {
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'You can edit this item from approval only.')
      this.msgService.openMsgBox(this.msgBoxId)
      return
    }
    if (status == ItemStatus.Splitted) {
      if (this.importedapprovalsList[approvalIndex].items[i].lotNo.value == null || this.importedapprovalsList[approvalIndex].items[i].lotNo.value == '') {
        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'Enter lot no first')
        this.msgService.openMsgBox(this.msgBoxId)
        return
      }
      var invalidFlag = false
      if (this.importedapprovalsList[approvalIndex].items[i].description.invalid) {
        this.items[i].description.markAsDirty()
        this.items[i].description.markAsTouched()
        invalidFlag = true
      }
      if (this.importedapprovalsList[approvalIndex].items[i].weightCarats.invalid) {
        this.items[i].weightCarats.markAsDirty()
        this.items[i].weightCarats.markAsTouched()
        invalidFlag = true
      }
      if (this.importedapprovalsList[approvalIndex].items[i].pricePerUnit.invalid) {
        this.items[i].pricePerUnit.markAsDirty()
        this.items[i].pricePerUnit.markAsTouched()
        invalidFlag = true
      }
      if (invalidFlag) {
        return
      }

      if (this.importedapprovalsList[approvalIndex].items[i].splittedItems.length == 0) {
        this.addItemToApproval(approvalIndex, i)
        this.addItemToApproval(approvalIndex, i)
      }
    } else {
      this.importedapprovalsList[approvalIndex].items[i].lotNo.enable()
      this.importedapprovalsList[approvalIndex].items[i].description.enable()
      this.importedapprovalsList[approvalIndex].items[i].weightCarats.enable()
      this.importedapprovalsList[approvalIndex].items[i].pricePerUnit.enable()
    }
    this.importedapprovalsList[approvalIndex].items[i].status = status
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
        if (splittedItem1.status != ItemStatus.Returned && splittedItem1.status != ItemStatus.Splitted && splittedItem1.status != ItemStatus.Pending) {
          amountx += Number(this.amount(splittedItem1))
        }
        //level - 2
        if (splittedItem1.status == ItemStatus.Splitted) {
          splittedItem1.splittedItems.forEach((splittedItem2: any) => {
            if (splittedItem2.status != ItemStatus.Returned && splittedItem2.status != ItemStatus.Splitted && splittedItem2.status != ItemStatus.Pending) {
              amountx += Number(this.amount(splittedItem2))
            }
            //level - 3
            if (splittedItem2.status == ItemStatus.Splitted) {
              splittedItem2.splittedItems.forEach((splittedItem3: any) => {
                if (splittedItem3.status != ItemStatus.Returned && splittedItem3.status != ItemStatus.Splitted && splittedItem3.status != ItemStatus.Pending) {
                  amountx += Number(this.amount(splittedItem3))
                }
              })
            }
          })
        }
      })
    }

    if (item.status != ItemStatus.Returned && item.status != ItemStatus.Splitted && item.status != ItemStatus.Pending) {
      amountx += Number(this.amount(item))
    }
    return amountx.toFixed(2)
  }

  getSubTotal() {
    let subTotal = 0
    this.items.forEach(item => {
      subTotal += Number(this.getAmount(item))
    })
    this.importedapprovalsList.forEach((approval: any) => {
      approval.items.forEach((item: any) => {
        subTotal += Number(this.getAmount(item))
      })
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

  getItemVat(item: IItem) {
    return Number((item.amount * (Vat.vatPr / 100)).toFixed(2))
  }

  getItemTotalWithVat(item: IItem) {
    return Number((item.amount + this.getItemVat(item)).toFixed(2))
  }

  getTotalString() {
    return this.getTotal().toFixed(2)
  }

  getSubTotalString() {
    return this.getSubTotal().toFixed(2)
  }

  getApprovalSubTotal(items: IItem[]) {
    let subTotal = 0
    items.forEach(item => {
      subTotal += Number(this.getAmount(item))
    })
    return subTotal
  }

  getApprovalVat(items: IItem[]) {
    return Number((this.getApprovalSubTotal(items) * (Vat.vatPr / 100)).toFixed(2))
  }
  getApprovalTotal(items: IItem[]) {
    return Number((this.getApprovalSubTotal(items) + this.getApprovalVat(items)).toFixed(2))
  }


  async importApproval() {
    if (this.selectedApproval == null) {
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Select Approval First.')
      this.msgService.openMsgBox(this.msgBoxId)
      return
    }
    this.isImporting = true
    try {
      var params = new HttpParams({});

      var isAlreadyExists = false

      this.importedapprovalsList.forEach(approval => {
        if (approval.approval.id == this.selectedApproval!.id) {
          isAlreadyExists = true
          return
        }
      })

      console.log(this.isUpdate)

      if (this.isUpdate && this.invoice != null) {
        if (isAlreadyExists) {
          params = new HttpParams({
            fromObject: { 'statusToExclude': [ItemStatus.Billed, ItemStatus.Returned] }
          });
        } else {
          params = new HttpParams({
            fromObject: { 'statusToExclude': [ItemStatus.Returned] }
          });
        }
        params = params.append('invoiceId', this.invoice.id!)
      } else {
        params = new HttpParams({
          fromObject: { 'statusToExclude': [ItemStatus.Billed, ItemStatus.Returned] }
        });
      }
      var importedApprovalItems: IItem[] = await new Promise(resolve => {
        this.itemService.getAllByApproval(this.selectedApproval!.id!, params).pipe(
          take(1)
        ).subscribe(
          (response) => {
            console.log(response)
            if (response.isSuccess) {
              resolve(response.data)
            } else {
              this.msgService.setColor(this.msgBoxId, Color.danger)
              if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
                this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
              } else {
                this.msgService.setMsg(this.msgBoxId, 'Somthing is wrong try again later')
              }
              this.msgService.openMsgBox(this.msgBoxId)
            }
          },
          (error) => {
            this.msgService.setColor(this.msgBoxId, Color.danger)
            this.msgService.setMsg(this.msgBoxId, 'Somthing is wrong try again later')
            this.msgService.openMsgBox(this.msgBoxId)
          }
        )
      })

      console.log(importedApprovalItems)

      var NewImpotedApproval: any = {
        approval: this.selectedApproval,
        items: [] as any
      }

      const map = {}
      const roots = [] as any
      importedApprovalItems!.forEach(item => {
        var invoiceIds: number[] = []
        if (item.invoiceItems != null) {
          item.invoiceItems.forEach(invoiceItem => {
            if (item.id == invoiceItem.itemId) {
              invoiceIds.push(invoiceItem.invoiceId)
            }
          })
        }
        item.newInvoiceIds = invoiceIds
        map[item.id!] = item
        item.splittedItems = []
      })
      importedApprovalItems!.forEach(item => {
        if (item.parentItemId !== null) {
          if (map[item.parentItemId!]) {
            map[item.parentItemId!].splittedItems.push(item);
          }
        } else {
          roots.push(item);
        }
      })

      console.log(roots)

      roots.forEach(item => {
        var newItem = {
          id: 0,
          newInvoiceIds: [] as number[],
          defaultSplitted: false,
          parentItemId: 0,
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

        var invoiceIds: number[] = []
        newItem.id = item.id!
        newItem.newInvoiceIds = item.newInvoiceIds
        newItem.description.setValue(item.description)
        newItem.lotNo.setValue(item.lotNo != null ? item.lotNo.toString() : '')
        newItem.weightCarats.setValue(item.weightCarats.toString())
        newItem.pricePerUnit.setValue(item.pricePerUnit.toString())
        newItem.pricePerUnitCurrancy = item.pricePerUnitCurrancy
        newItem.quantityUnit = item.quantityUnit
        if (item.status == ItemStatus.Pending) {
          newItem.status = ItemStatus.AddedToBill
        } else {
          newItem.status = item.status
        }
        newItem.splittedItems = []
        if (item.parentItemId != null) {
          newItem.parentItemId = item.parentItemId!
        }

        //level - 1
        if (item.status == ItemStatus.Splitted) {
          newItem.defaultSplitted = true
        }
        newItem.lotNo.disable()
        newItem.description.disable()
        newItem.weightCarats.disable()
        newItem.pricePerUnit.disable()
        item.splittedItems!.forEach(splittedItem1 => {
          var newItem1 = {
            id: 0,
            newInvoiceIds: [] as number[],
            defaultSplitted: false,
            parentItemId: 0,
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
          if (splittedItem1.status == ItemStatus.Pending) {
            newItem1.status = ItemStatus.AddedToBill
          } else {
            newItem1.status = splittedItem1.status
          }
          newItem1.splittedItems = []
          newItem1.description.disable()
          newItem1.lotNo.disable()
          newItem1.pricePerUnit.disable()
          if (splittedItem1.parentItemId != null) {
            newItem1.parentItemId = splittedItem1.parentItemId!
          }
          if (splittedItem1.status == ItemStatus.Splitted) {
            newItem1.defaultSplitted = true
          }
          newItem1.lotNo.disable()
          newItem1.description.disable()
          newItem1.weightCarats.disable()
          newItem1.pricePerUnit.disable()

          //level- 2
          splittedItem1.splittedItems!.forEach(splittedItem2 => {
            var newItem2 = {
              id: 0,
              newInvoiceIds: [] as number[],
              defaultSplitted: false,
              parentItemId: 0,
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
            if (splittedItem2.status == ItemStatus.Pending) {
              newItem2.status = ItemStatus.AddedToBill
            } else {
              newItem2.status = splittedItem2.status
            }
            newItem2.splittedItems = []
            newItem2.description.disable()
            newItem2.lotNo.disable()
            newItem2.pricePerUnit.disable()
            if (splittedItem2.parentItemId != null) {
              newItem2.parentItemId = splittedItem2.parentItemId!
            }
            if (splittedItem2.status == ItemStatus.Splitted) {
              newItem2.defaultSplitted = true
            }
            newItem2.lotNo.disable()
            newItem2.description.disable()
            newItem2.weightCarats.disable()
            newItem2.pricePerUnit.disable()

            //level - 3
            splittedItem2.splittedItems!.forEach(splittedItem3 => {
              var newItem3 = {
                id: 0,
                newInvoiceIds: [] as number[],
                defaultSplitted: false,
                parentItemId: 0,
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
              if (splittedItem3.status == ItemStatus.Pending) {
                newItem3.status = ItemStatus.AddedToBill
              } else {
                newItem3.status = splittedItem3.status
              }
              newItem3.defaultSplitted = false
              newItem3.splittedItems = []
              newItem3.description.disable()
              newItem3.lotNo.disable()
              newItem3.pricePerUnit.disable()
              newItem3.weightCarats.disable()
              if (splittedItem3.parentItemId != null) {
                newItem3.parentItemId = splittedItem3.parentItemId!
              }
              console.log('newItem3')
              console.log(newItem3)
              if (newItem3.status != ItemStatus.Splitted || newItem3.splittedItems.length > 0) {
                newItem2.splittedItems.push(newItem3)
              }
            })
            console.log('newItem2')
            console.log(newItem2)
            if (newItem2.status != ItemStatus.Splitted || newItem2.splittedItems.length > 0) {
              newItem1.splittedItems.push(newItem2)
            }
          })
          if (newItem1.status != ItemStatus.Splitted || newItem1.splittedItems.length > 0) {
            newItem.splittedItems.push(newItem1)
          }
        })
        console.log('newItem')
        console.log(newItem)
        if (newItem.status != ItemStatus.Splitted || newItem.splittedItems.length > 0) {
          NewImpotedApproval.items.push(newItem)
        }
      })

      if (this.selectedApproval.status == ApprovalStatus.Billed) {
        this.approvalsToUnbill = this.approvalsToUnbill.filter((approval) => {
          return approval.id != this.selectedApproval!.id
        })
      }

      this.importedapprovalsList.push(NewImpotedApproval)
      console.log(this.importedapprovalsList)
      this.approvalSelectOptions = this.approvalSelectOptions.filter((approval) => approval.id != this.selectedApproval!.id)

      if (this.isUpdate) {
        this.approvalsToUnbill = this.approvalsToUnbill.filter((approval) => {
          this.invoice!.invoiceApprovals!.forEach(invoiceApproval => {
            return approval.id == invoiceApproval.approvalId
          })
        })
      }

      this.selectedApproval = null
      this.msgService.setColor(this.msgBoxId, Color.success)
      this.msgService.setMsg(this.msgBoxId, 'Approval imported successfully.')
      this.msgService.openMsgBox(this.msgBoxId)
      this.isImporting = false

    } catch (e) {
      if (environment.isDevMode) {
        console.log(e)
      };
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Something is wrong, Try again later.')
      this.msgService.openMsgBox(this.msgBoxId)
      this.isImporting = false
    }
  }

  // Save
  async save() {
    console.log('pre save')
    console.log(this.items)
    if (this.isSaving) {
      return;
    }
    this.isSaving = true
    try {
      var status = await this.saveRecords()
      if (status) {
        this.router.navigate(['invoices'])
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
        this.router.navigate(['invoices/view', btoa(this.invoice!.id!.toString())])
      }
    } catch (e) {
      if (environment.isDevMode) {
        console.log(e)
      }
    }
    this.isPreviewing = false
  }

  getApprovalStatus(approvalItems: IItem[]) {
    var approvalStatus = ApprovalStatus.Returned
    var isPending = false
    var isBilled = false
    approvalItems.forEach((item) => {
      if (item.status == ItemStatus.AddedToBill || item.status == ItemStatus.Billed) {
        isBilled = true
      }
      else if (item.status == ItemStatus.Pending) {
        isPending = true
      }
      else if (item.status == ItemStatus.Splitted && item.splittedItems!.length > 0) {
        item.splittedItems!.forEach(splittedItem1 => {
          if (splittedItem1.status == ItemStatus.AddedToBill || splittedItem1.status == ItemStatus.Billed) {
            isBilled = true
          } else if (splittedItem1.status == ItemStatus.Pending) {
            isPending = true
          } else if (splittedItem1.status == ItemStatus.Splitted && splittedItem1.splittedItems!.length > 0) {
            splittedItem1.splittedItems!.forEach(splittedItem2 => {
              if (splittedItem2.status == ItemStatus.AddedToBill || splittedItem2.status == ItemStatus.Billed) {
                isBilled = true
              } else if (splittedItem2.status == ItemStatus.Pending) {
                isPending = true
              } else if (splittedItem2.status == ItemStatus.Splitted && splittedItem2.splittedItems!.length > 0) {
                splittedItem2.splittedItems!.forEach(splittedItem3 => {
                  if (splittedItem3.status == ItemStatus.AddedToBill || splittedItem3.status == ItemStatus.Billed) {
                    isBilled = true
                  } else if (splittedItem3.status == ItemStatus.Pending) {
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

  validateFields() {
    var invalidFlag = false
    var billingItemCount = 0
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

                  if (splittedItem3.status == ItemStatus.AddedToBill || splittedItem3.status == ItemStatus.Billed) {
                    billingItemCount++
                  }
                })
                if (quantitySum3 != Number(splittedItem2.weightCarats.value)) {
                  invalidFlag = true
                  splittedItem2.quantityErrorMessange = this.subItemCountError
                  splittedItem2.isQuantityError = true
                } else {
                  splittedItem2.isQuantityError = false
                }
              }

              if (splittedItem2.status == ItemStatus.AddedToBill || splittedItem2.status == ItemStatus.Billed) {
                billingItemCount++
              }
            })
            if (quantitySum2 != Number(splittedItem1.weightCarats.value)) {
              invalidFlag = true
              splittedItem1.quantityErrorMessange = this.subItemCountError
              splittedItem1.isQuantityError = true
            } else {
              splittedItem1.isQuantityError = false
            }
          }
          if (splittedItem1.status == ItemStatus.AddedToBill || splittedItem1.status == ItemStatus.Billed) {
            billingItemCount++
          }
        })
        if (quantitySum1 != Number(item.weightCarats.value)) {
          invalidFlag = true
          item.quantityErrorMessange = this.subItemCountError
          item.isQuantityError = true
        } else {
          item.isQuantityError = false
        }
      }
      if (item.status == ItemStatus.AddedToBill || item.status == ItemStatus.Billed) {
        billingItemCount++
      }
    })

    this.importedapprovalsList.forEach((approvalItem: any) => {
      approvalItem.items.forEach((item: any) => {
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

                    if (splittedItem3.status == ItemStatus.AddedToBill || splittedItem3.status == ItemStatus.Billed) {
                      billingItemCount++
                    }
                  })
                  if (quantitySum3 != Number(splittedItem2.weightCarats.value) && !splittedItem2.defaultSplitted) {
                    invalidFlag = true
                    splittedItem2.quantityErrorMessange = this.subItemCountError
                    splittedItem2.isQuantityError = true
                  } else {
                    splittedItem2.isQuantityError = false
                  }
                }
                if (splittedItem2.status == ItemStatus.AddedToBill || splittedItem2.status == ItemStatus.Billed) {
                  billingItemCount++
                }
              })
              if (quantitySum2 != Number(splittedItem1.weightCarats.value) && !splittedItem1.defaultSplitted) {
                invalidFlag = true
                splittedItem1.quantityErrorMessange = this.subItemCountError
                splittedItem1.isQuantityError = true
              } else {
                splittedItem1.isQuantityError = false
              }
            }
            if (splittedItem1.status == ItemStatus.AddedToBill || splittedItem1.status == ItemStatus.Billed) {
              billingItemCount++
            }
          })
          if (quantitySum1 != Number(item.weightCarats.value) && !item.defaultSplitted) {
            invalidFlag = true
            item.quantityErrorMessange = this.subItemCountError
            item.isQuantityError = true
          } else {
            item.isQuantityError = false
          }
        }
        if (item.status == ItemStatus.AddedToBill || item.status == ItemStatus.Billed) {
          billingItemCount++
        }
      })
    })
    return [invalidFlag, billingItemCount]
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

    if (this.items.length == 0 && this.importedapprovalsList.length == 0) {
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Minimum 1 item is required.')
      this.msgService.openMsgBox(this.msgBoxId)
      return false
    }

    var [invalidFlag, billingItemCount] = this.validateFields()

    if (invalidFlag) {
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Enter valid value.')
      this.msgService.openMsgBox(this.msgBoxId)
      return false
    }

    if(billingItemCount  == 0){
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Minimum 1 billing item required')
      this.msgService.openMsgBox(this.msgBoxId)
      return false
    }

    if (this.isPaid.value! && this.PaymentDateControl.value == '') {
      this.msgService.setColor(this.msgBoxId, Color.danger)
      this.msgService.setMsg(this.msgBoxId, 'Select payment date.')
      this.msgService.openMsgBox(this.msgBoxId)
      return false
    }

    this.isSavingRecords = true

    try {

      var newApprovalIds = [] as number[]
      this.importedapprovalsList.forEach((approval: any) => {
        var index = newApprovalIds.indexOf(approval.approval.id)
        if (index == -1) {
          newApprovalIds.push(approval.approval.id)
        }
      })
      var InvoiceTobeSaved: IInvoice = {
        totalAmount: this.getSubTotal(),
        vat: this.getVat(),
        newApprovalIds: newApprovalIds,
        totalAmountIncludingVat: this.getTotal(),
        customerId: this.selectedCustomer.id!,
        salesmanId: this.user.id,
        status: this.isPaid.value! ? InvoiceStatus.Paid : InvoiceStatus.Pending,
      } as IInvoice

      if (this.isPaid.value!) {
        const date = new Date(this.PaymentDateControl.value!)
        InvoiceTobeSaved.paymentDate = new Date(date!.getUTCFullYear(), date!.getUTCMonth(), date!.getUTCDate())
      }

      var invoice: IInvoice = {} as IInvoice

      if (this.isUpdate) {
        InvoiceTobeSaved.invoiceNo = this.invoice!.invoiceNo
        InvoiceTobeSaved.id = this.invoice!.id
        invoice = await new Promise(resolve => {
          this.invoiceService.update(InvoiceTobeSaved).pipe(
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
              this.router.navigate(['/invoices'])
            }
          )
        })
      } else {
        invoice = await new Promise(resolve => {
          this.invoiceService.create(InvoiceTobeSaved).pipe(
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
              this.router.navigate(['/invoices'])
            }
          )
        })
      }

      var itemsToBeCreated: IItem[] = []
      var itemsToBeUpdated: IItem[] = []

      console.log(this.items)
      // level - 0
      this.items.forEach((item, i) => {
        var newItem = {
          description: item.description.value!,
          lotNo: item.lotNo.value!,
          weightCarats: Number(item.weightCarats.value!),
          quantityUnit: item.quantityUnit,
          pricePerUnit: Number(item.pricePerUnit.value!),
          pricePerUnitCurrancy: item.pricePerUnitCurrancy,
          amount: Number(this.amount(item)),
          splittedItems: [] as IItem[]
        } as IItem

        // level - 1
        item.splittedItems.forEach((splittedItem1, j) => {
          if (item.status != ItemStatus.Splitted) {
            this.removeItem(i, item.splittedItems.length - 1, undefined, undefined, true)
            return
          }
          var newItem1 = {
            description: splittedItem1.description.value!,
            lotNo: splittedItem1.lotNo.value!,
            weightCarats: Number(splittedItem1.weightCarats.value!),
            quantityUnit: splittedItem1.quantityUnit,
            pricePerUnit: Number(splittedItem1.pricePerUnit.value!),
            pricePerUnitCurrancy: splittedItem1.pricePerUnitCurrancy,
            amount: Number(this.amount(splittedItem1)),
            splittedItems: [] as IItem[]
          } as IItem

          //level - 2
          splittedItem1.splittedItems.forEach((splittedItem2, k) => {
            if (splittedItem1.status != ItemStatus.Splitted ) {
              this.removeItem(i, j, splittedItem1.splittedItems.length - 1, undefined, true)
              return
            }
            var newItem2 = {
              description: splittedItem2.description.value!,
              lotNo: splittedItem2.lotNo.value!,
              weightCarats: Number(splittedItem2.weightCarats.value!),
              quantityUnit: splittedItem2.quantityUnit,
              pricePerUnit: Number(splittedItem2.pricePerUnit.value!),
              pricePerUnitCurrancy: splittedItem2.pricePerUnitCurrancy,
              amount: Number(this.amount(splittedItem2)),
              splittedItems: [] as IItem[]
            } as IItem
            

            //level - 3
            splittedItem2.splittedItems.forEach((splittedItem3, l) => {
              if (splittedItem2.status != ItemStatus.Splitted) {
                this.removeItem(i, j, k, splittedItem2.splittedItems.length - 1, true)
                return
              }
              var newItem3 = {
                description: splittedItem3.description.value!,
                lotNo: splittedItem3.lotNo.value!,
                weightCarats: Number(splittedItem3.weightCarats.value!),
                quantityUnit: splittedItem3.quantityUnit,
                pricePerUnit: Number(splittedItem3.pricePerUnit.value!),
                pricePerUnitCurrancy: splittedItem3.pricePerUnitCurrancy,
                amount: Number(this.amount(splittedItem3)),
              } as IItem
              if (splittedItem3.status == ItemStatus.AddedToBill) {
                newItem3.status = ItemStatus.Billed
              } else {
                newItem3.status = splittedItem3.status
              }
              newItem3.vat = this.getItemVat(newItem1)
              newItem3.amountIncludingVat = this.getItemTotalWithVat(newItem3)

              if (newItem3.status == ItemStatus.Billed || newItem3.status == ItemStatus.Splitted  || newItem3.status == ItemStatus.Returned) {
                var index = splittedItem3.newInvoiceIds.indexOf(invoice.id!)
                if (index == -1) {
                  splittedItem3.newInvoiceIds.push(invoice.id!)
                }
              }
              newItem3.newInvoiceIds = splittedItem3.newInvoiceIds

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

            if (splittedItem2.status == ItemStatus.AddedToBill) {
              newItem2.status = ItemStatus.Billed
            } else {
              newItem2.status = splittedItem2.status
            }
            newItem2.vat = this.getItemVat(newItem2)
            newItem2.amountIncludingVat = this.getItemTotalWithVat(newItem2)
            if (newItem2.status == ItemStatus.Billed || newItem2.status == ItemStatus.Splitted  || newItem2.status == ItemStatus.Returned) {
              var index = splittedItem2.newInvoiceIds.indexOf(invoice.id!)
              if (index == -1) {
                splittedItem2.newInvoiceIds.push(invoice.id!)
              }
            }
            newItem2.newInvoiceIds = splittedItem2.newInvoiceIds


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

          if (splittedItem1.status == ItemStatus.AddedToBill) {
            newItem1.status = ItemStatus.Billed
          } else {
            newItem1.status = splittedItem1.status
          }
          newItem1.vat = this.getItemVat(newItem1)
          newItem1.amountIncludingVat = this.getItemTotalWithVat(newItem1)
          var index = splittedItem1.newInvoiceIds.indexOf(invoice.id!)
          if (newItem1.status == ItemStatus.Billed || newItem1.status == ItemStatus.Returned || newItem1.status == ItemStatus.Splitted) {
            var index = splittedItem1.newInvoiceIds.indexOf(invoice.id!)
            if (index == -1) {
              splittedItem1.newInvoiceIds.push(invoice.id!)
            }
          }
          newItem1.newInvoiceIds = splittedItem1.newInvoiceIds

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

        if (item.status == ItemStatus.AddedToBill) {
          newItem.status = ItemStatus.Billed
        } else {
          newItem.status = item.status
        }
        if (newItem.status == ItemStatus.Billed || newItem.status == ItemStatus.Splitted  || newItem.status == ItemStatus.Returned) {
          var index = item.newInvoiceIds.indexOf(invoice.id!)
          if (index == -1) {
            item.newInvoiceIds.push(invoice.id!)
          }
        }
        newItem.newInvoiceIds = item.newInvoiceIds
        newItem.vat = this.getItemVat(newItem)
        newItem.amountIncludingVat = this.getItemTotalWithVat(newItem)
        var index = item.newInvoiceIds.indexOf(invoice.id!)
        if (index == -1) {
          item.newInvoiceIds.push(invoice.id!)
        }
        newItem.newInvoiceIds = item.newInvoiceIds

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

      console.log(itemsToBeCreated)

      var approvalsToBeUpdate: IApproval[] = []
      if (this.importedapprovalsList.length != 0) {
        console.log(this.importedapprovalsList)
        this.importedapprovalsList.forEach((approval: any, approvalindex) => {

          approval.approval.status = this.getApprovalStatus(approval.items)
          approval.approval.invoiceId = invoice.id
          approval.approval.invoiceNo = invoice.invoiceNo
          approval.approval.totalAmount = this.getApprovalSubTotal(approval.items)
          approval.approval.vat = this.getApprovalVat(approval.items)
          approval.approval.totalAmountIncludingVat = this.getApprovalTotal(approval.items)
          approval.approval.customer = null
          approval.approval.invoice = null
          approval.approval.salesman = null
          approvalsToBeUpdate.push(approval.approval)
          approval.items.forEach((item, i) => {
            var newItem = {
              approvalId: Number(approval.approval.id),
              description: item.description.value!,
              lotNo: item.lotNo.value!,
              weightCarats: Number(item.weightCarats.value!),
              quantityUnit: item.quantityUnit,
              pricePerUnit: Number(item.pricePerUnit.value!),
              pricePerUnitCurrancy: item.pricePerUnitCurrancy,
              amount: Number(this.amount(item)),
              splittedItems: [] as IItem[]
            } as IItem
            console.log(item)
            // level - 1
            item.splittedItems.forEach((splittedItem1, j) => {

              if (item.status != ItemStatus.Splitted) {
                this.removeItemFromApproval( approvalindex, i, item.splittedItems.length - 1, undefined, undefined, true)
                return
              }
              var newItem1 = {
                approvalId: Number(approval.approval.id),
                description: splittedItem1.description.value!,
                lotNo: splittedItem1.lotNo.value!,
                weightCarats: Number(splittedItem1.weightCarats.value!),
                quantityUnit: splittedItem1.quantityUnit,
                pricePerUnit: Number(splittedItem1.pricePerUnit.value!),
                pricePerUnitCurrancy: splittedItem1.pricePerUnitCurrancy,
                amount: Number(this.amount(splittedItem1)),
                splittedItems: [] as IItem[]
              } as IItem

              //level - 2
              splittedItem1.splittedItems.forEach((splittedItem2, k) => {
                if (splittedItem1.status != ItemStatus.Splitted) {
                  this.removeItemFromApproval( approvalindex,i, j, splittedItem1.splittedItems.length - 1, undefined, true)
                  return
                }
                var newItem2 = {
                  approvalId: Number(approval.approval.id),
                  description: splittedItem2.description.value!,
                  lotNo: splittedItem2.lotNo.value!,
                  weightCarats: Number(splittedItem2.weightCarats.value!),
                  quantityUnit: splittedItem2.quantityUnit,
                  pricePerUnit: Number(splittedItem2.pricePerUnit.value!),
                  pricePerUnitCurrancy: splittedItem2.pricePerUnitCurrancy,
                  amount: Number(this.amount(splittedItem2)),
                  splittedItems: [] as IItem[]
                } as IItem

                newItem2.vat = this.getItemVat(newItem2)
                newItem2.amountIncludingVat = this.getItemTotalWithVat(newItem2)

                //level - 3
                splittedItem2.splittedItems.forEach((splittedItem3, l) => {
                  if (splittedItem2.status != ItemStatus.Splitted) {
                    this.removeItemFromApproval( approvalindex,i, j, k, splittedItem2.splittedItems.length - 1, true)
                    return
                  }
                  var newItem3 = {
                    approvalId: Number(approval.approval.id),
                    description: splittedItem3.description.value!,
                    lotNo: splittedItem3.lotNo.value!,
                    weightCarats: Number(splittedItem3.weightCarats.value!),
                    quantityUnit: splittedItem3.quantityUnit,
                    pricePerUnit: Number(splittedItem3.pricePerUnit.value!),
                    pricePerUnitCurrancy: splittedItem3.pricePerUnitCurrancy,
                    amount: Number(this.amount(splittedItem3)),
                  } as IItem
                  if (splittedItem3.status == ItemStatus.AddedToBill) {
                    newItem3.status = ItemStatus.Billed
                  } else {
                    newItem3.status = splittedItem3.status
                  }
                  console.log('splittedItem3')
                  console.log(splittedItem3.newInvoiceIds)
                  if (newItem3.status == ItemStatus.Billed || newItem3.status == ItemStatus.Splitted) {
                    var index = splittedItem3.newInvoiceIds.indexOf(invoice.id!)
                    if (index == -1) {
                      splittedItem3.newInvoiceIds.push(invoice.id!)
                    }
                  } else {
                    var index = splittedItem3.newInvoiceIds.indexOf(invoice.id!)
                    if (index != -1) {
                      splittedItem3.newInvoiceIds = splittedItem3.newInvoiceIds.filter(id => id !== invoice.id!)
                    }
                  }

                  newItem3.newInvoiceIds = splittedItem3.newInvoiceIds
                  newItem3.vat = this.getItemVat(newItem1)
                  newItem3.amountIncludingVat = this.getItemTotalWithVat(newItem3)

                  newItem3.newInvoiceIds = splittedItem3.newInvoiceIds
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

                if (splittedItem2.status == ItemStatus.AddedToBill) {
                  newItem2.status = ItemStatus.Billed
                } else {
                  newItem2.status = splittedItem2.status
                }
                if (newItem2.status == ItemStatus.Billed || newItem2.status == ItemStatus.Splitted) {
                  var index = splittedItem2.newInvoiceIds.indexOf(invoice.id!)
                  if (index == -1) {
                    splittedItem2.newInvoiceIds.push(invoice.id!)
                  }
                } else {
                  var index = splittedItem2.newInvoiceIds.indexOf(invoice.id!)
                  if (index != -1) {
                    splittedItem2.newInvoiceIds = splittedItem2.newInvoiceIds.filter(id => id !== invoice.id!)
                  }
                }
                newItem2.newInvoiceIds = splittedItem2.newInvoiceIds

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
              if (splittedItem1.status == ItemStatus.AddedToBill) {
                newItem1.status = ItemStatus.Billed
              } else {
                newItem1.status = splittedItem1.status
              }
              if (newItem1.status == ItemStatus.Billed || newItem1.status == ItemStatus.Splitted) {
                var index = splittedItem1.newInvoiceIds.indexOf(invoice.id!)
                if (index == -1) {
                  splittedItem1.newInvoiceIds.push(invoice.id!)
                }
              } else {
                var index = splittedItem1.newInvoiceIds.indexOf(invoice.id!)
                if (index != -1) {
                  splittedItem1.newInvoiceIds = splittedItem1.newInvoiceIds.filter(id => id !== invoice.id!)
                }
              }
              newItem1.newInvoiceIds = splittedItem1.newInvoiceIds

              newItem1.vat = this.getItemVat(newItem1)
              newItem1.amountIncludingVat = this.getItemTotalWithVat(newItem1)

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

            if (item.status == ItemStatus.AddedToBill) {
              newItem.status = ItemStatus.Billed
            } else {
              newItem.status = item.status
            }
            if (newItem.status == ItemStatus.Billed || newItem.status == ItemStatus.Splitted) {
              var index = item.newInvoiceIds.indexOf(invoice.id!)
              if (index == -1) {
                item.newInvoiceIds.push(invoice.id!)
              }
            } else {
              var index = item.newInvoiceIds.indexOf(invoice.id!)
              if (index != -1) {
                item.newInvoiceIds = item.newInvoiceIds.filter(id => id !== invoice.id!)
              }
            }
            newItem.newInvoiceIds = item.newInvoiceIds
            newItem.vat = this.getItemVat(newItem)
            newItem.amountIncludingVat = this.getItemTotalWithVat(newItem)

            if (item.id != 0) {
              newItem.id = item.id
              newItem.approval = undefined
              itemsToBeUpdated.push(newItem)
            } else {
              itemsToBeCreated.push(newItem)
            }
          })
        })
      }

      if (this.itemsToRemove.length != 0) {
        await new Promise(resolve => {
          this.itemService.deleteRange(this.itemsToRemove).pipe(
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

      if (this.approvalsToUnbill.length != 0) {
        this.approvalsToUnbill.forEach((approval) => {
          approval.status = ApprovalStatus.Pending
          approvalsToBeUpdate.push(approval)
          this.itemToBeRemoveInvoiceId.forEach((item) => {
            if (item.approvalId == approval.id) {
              item.splittedItems!.forEach(splittedItem1 => {
                splittedItem1.splittedItems!.forEach(splittedItem2 => {
                  splittedItem2.splittedItems!.forEach(splittedItem3 => {

                    var index = splittedItem3.newInvoiceIds!.indexOf(invoice.id!)
                    if (index != -1) {
                      splittedItem3.newInvoiceIds = splittedItem3.newInvoiceIds!.filter(id => id !== invoice.id!)
                    }
                    splittedItem3.newInvoiceIds = splittedItem3.newInvoiceIds
                    if (splittedItem3.status == ItemStatus.Billed) {
                      splittedItem3.status = ItemStatus.Pending
                    }
                    itemsToBeUpdated.push(splittedItem3)
                  })


                  var index = splittedItem2.newInvoiceIds!.indexOf(invoice.id!)
                  if (index != -1) {
                    splittedItem2.newInvoiceIds = splittedItem2.newInvoiceIds!.filter(id => id !== invoice.id!)
                  }
                  if (splittedItem2.status == ItemStatus.Billed) {
                    splittedItem2.status = ItemStatus.Pending
                  }
                  itemsToBeUpdated.push(splittedItem2)
                })


                var index = splittedItem1.newInvoiceIds!.indexOf(invoice.id!)
                if (index != -1) {
                  splittedItem1.newInvoiceIds = splittedItem1.newInvoiceIds!.filter(id => id !== invoice.id!)
                }
                if (splittedItem1.status == ItemStatus.Billed) {
                  splittedItem1.status = ItemStatus.Pending
                }
                itemsToBeUpdated.push(splittedItem1)
              })
              var index = item.newInvoiceIds!.indexOf(invoice.id!)
              if (index != -1) {
                item.newInvoiceIds = item.newInvoiceIds!.filter(id => id !== invoice.id!)
              }
              if (item.status != ItemStatus.Splitted) {
                item.status = ItemStatus.Pending
              }
              itemsToBeUpdated.push(item)
            }
          })


        })
      }


      // update item
      var itemMap = new Map<number, IItem>()
      itemsToBeUpdated.forEach((item) => {
        var key = item.id!
        if (itemMap.has(key)) {
          itemMap.get(key)!.amount += item.amount
          itemMap.get(key)!.vat += item.vat
          itemMap.get(key)!.amountIncludingVat += item.amountIncludingVat
        } else {
          itemMap.set(key, item)
        }
      })
      itemsToBeUpdated = Array.from(itemMap.values())
      console.log('itemsToBeUpdated')
      console.log(itemsToBeUpdated)
      if (itemsToBeUpdated.length != 0) {
        await new Promise(resolve => {
          this.itemService.updateRange(itemsToBeUpdated).pipe(
            take(1)
          ).subscribe(
            response => {
              if (response.isSuccess) {
                resolve(0)
              } else {
                if (environment.isDevMode) {
                  console.log(response)
                }
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

      //create items
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

      //update approvals
      var approvalMap = new Map<number, IApproval>()
      approvalsToBeUpdate.forEach((approval) => {
        var key = approval.id!
        if (approvalMap.has(key)) {
          approvalMap.get(key)!.totalAmount += approval.totalAmount
          approvalMap.get(key)!.vat += approval.vat
          approvalMap.get(key)!.totalAmountIncludingVat += approval.totalAmountIncludingVat
          approvalMap.get(key)!.updateDate = undefined
          if (approval.status != ApprovalStatus.Billed) {
            approvalMap.get(key)!.status = approval.status
          }
        } else {
          approvalMap.set(key, approval)
        }
      })
      approvalsToBeUpdate = Array.from(approvalMap.values())

      console.log('approval to update')
      console.log(approvalsToBeUpdate)

      if (approvalsToBeUpdate.length != 0) {
        await new Promise(resolve => {
          this.approvalService.updateRange(approvalsToBeUpdate).pipe(
            take(1)
          ).subscribe(
            response => {
              if (response.isSuccess) {
                resolve(0)
              } else {
                if (environment.isDevMode) {
                  console.log(response)
                }
                resolve(0)
                this.msgService.setColor(this.msgBoxId, Color.danger)
                if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
                  this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
                } else {
                  this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
                }
                this.msgService.openMsgBox(this.msgBoxId)
              }
            })
        })
      }



      this.invoice = invoice
      this.msgService.setColor(this.msgBoxId, Color.success)
      if (this.isUpdate) {
        this.msgService.setMsg(this.msgBoxId, 'Invoice updated successfully.')
      } else {
        this.msgService.setMsg(this.msgBoxId, 'Invoice created successfully.')
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
  deleteInvoice(entity: IInvoice) {
    this.alertService.setAlert({
      title: `Are you sure you want to delete invoice #${entity.invoiceNo}`,
      msg: 'Note: You will be not able to recover the invoice later.',
      okBtnColor: Color.danger,
      okBtnText: BtnText.delete,
      cancelBtnText: BtnText.cancel
    })
    this.alertService.onActionClicked.pipe(first()).subscribe(async value => {
      if (value) {

        if (entity.status == InvoiceStatus.Paid) {
          this.msgService.setColor(this.msgBoxId, Color.danger)
          this.msgService.setMsg(this.msgBoxId, 'You can not delete payed bill.')
          this.msgService.openMsgBox(this.msgBoxId)
        }

        try {
          this.invoiceService.delete(entity.id!).subscribe(
            (response) => {
              if (response.isSuccess) {
                this.msgService.setColor(this.msgBoxId, Color.success)
                this.msgService.setMsg(this.msgBoxId, 'Invoice deleted successfully')
                this.msgService.openMsgBox(this.msgBoxId)
                this.router.navigate(['invoices'])
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
              if (error.error && error.error.errorMessages && error.error.errorMessages[0] && error.error.errorMessages[0] != "") {
                this.msgService.setMsg(this.msgBoxId, error.error.errorMessages[0])
              } else {
                this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
              }
              this.msgService.openMsgBox(this.msgBoxId)
            })
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


  // Get Approvals
  async getApprovals() {
    try {
      var params: any = {
        search: this.approvalSearchString,
        orderBy: ApprovalFields.createDate,
        order: Order.DESC,
        statusToExclude: [ItemStatus.Billed, ItemStatus.Returned],
        customerId: this.selectedCustomer!.id
      }

      this.approvalService.getAll(params).subscribe(
        (response) => {
          if (response.isSuccess) {
            this.approvalSelectOptions = response.data.records
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
            trn: this.newTRN.value! ?? '',
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
        search: this.customerSearchString,
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

  // search customer
  filterCustomerData(event: Event) {
    event.preventDefault();
    var searchInputField = event.target as HTMLInputElement
    if (this.customerSearchString == searchInputField.value) {
      return
    }
    this.customerSearchString = searchInputField.value
    this.customerInputSearch.next(this.customerSearchString)
  }

  // search approval
  filterApprovalData(event: Event) {
    event.preventDefault();
    var searchInputField = event.target as HTMLInputElement
    if (this.approvalSearchString == searchInputField.value) {
      return
    }
    this.approvalSearchString = searchInputField.value
    this.approvalInputSearch.next(this.approvalSearchString)
  }

}
