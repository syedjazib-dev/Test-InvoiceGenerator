
import { QuantityUnit } from 'src/assets/static_data/QuatityCategory'
import IInvoice from './invoice.model'
import IApproval from './approval.model'
import IInvoiceItem from './InvoiceItem.model'

export default interface IItem {
    id?: number,
    parentItemId? : number
    ParentItem? : IItem
    approvalId?: number,
    approval? : IApproval
    description: string,
    lotNo: string,
    weightCarats: number,
    quantityUnit: QuantityUnit,
    pricePerUnit: number,
    pricePerUnitCurrancy: string,
    amount: number,
    vat: number,
    amountIncludingVat: number,
    status: string
    splittedItems? : IItem[]
    invoiceItems? : IInvoiceItem[] 
    newInvoiceIds? : number[] 
    createDate?: Date,
    updateDate?: Date
}