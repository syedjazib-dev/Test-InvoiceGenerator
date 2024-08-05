import ICustomer from './customer.model'
import IUser from './user.model'
import IInvoice from './invoice.model'
import IInvoiceApproval from './InvoiceApproval.model'

export default interface IApproval {
    id?: number,
    approvalNo?: string,
    totalAmount: number,
    vat: number,
    totalAmountIncludingVat: number,
    customerId : number,
    customer?: ICustomer,
    salesmanId : string
    salesman?: IUser,
    invoiceApprovals? : IInvoiceApproval[] 
    status: string,
    createDate?: Date,
    updateDate?: Date
}   