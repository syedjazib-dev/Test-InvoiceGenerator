import ICustomer from './customer.model'
import IInvoiceApproval from './InvoiceApproval.model'
import IInvoiceItem from './InvoiceItem.model'
import IUser from './user.model'

export default interface    IInvoice {
    id?: number,
    invoiceNo	:string,
    totalAmount	:number,
    vat	:number,
    totalAmountIncludingVat	:number,
    customerId : number,
    customer?: ICustomer,
    salesmanId : string
    salesman?: IUser,
    status 	:string,
    invoiceApprovals? : IInvoiceApproval[] 
    invoiceItems? : IInvoiceItem[] 
    newApprovalIds? : number[]
    paymentDate? : Date
    createDate?: Date,
    updateDate?: Date
}