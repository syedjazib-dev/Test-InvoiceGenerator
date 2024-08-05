import IInvoice from "./invoice.model"
import IItem from "./item.model"

export default interface IInvoiceItem {
    id?: number,
    invoiceId : number
    invoice	:IInvoice,
    itemId : number
    item : IItem
}