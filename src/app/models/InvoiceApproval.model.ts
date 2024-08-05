import IApproval from "./approval.model"
import IInvoice from "./invoice.model"

export default interface IInvoiceApproval {
    id?: number,
    invoiceId : number
    invoice	:IInvoice,
    approvalId : number
    approval : IApproval
}