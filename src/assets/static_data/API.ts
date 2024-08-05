import { environment } from "src/environments/environment"
import { APIPath } from "./APIPath"

export class API {
    static BASE_URL: string = environment.APIBaseUrl


    // Auth
    static LOGIN: string = this.BASE_URL + APIPath.Auth + '/login'
    static LOGOUT: string = this.BASE_URL + APIPath.Auth + '/logout'
    static REFRESH_TOKEN: string = this.BASE_URL + APIPath.Auth + '/refreshToken'


    // User
    static CREATE_USER: string = this.BASE_URL + APIPath.Auth + '/register'
    static GET_USER: string = this.BASE_URL + APIPath.User
    static GET_USERS: string = this.BASE_URL + APIPath.User
    static UPDATE_USER: string = this.BASE_URL + APIPath.User
    static ACTIVE_USER: string = this.BASE_URL + APIPath.User + '/active'
    static DEACTIVE_USER: string = this.BASE_URL + APIPath.User + '/deactive'
    static USER_EXPORT_EXCEL: string = this.BASE_URL + APIPath.User + '/export/excel'

    // Customer
    static GET_CUSTOMERS: string = this.BASE_URL + APIPath.Customer
    static CREATE_CUSTOMERS: string = this.BASE_URL + APIPath.Customer
    static UPDATE_CUSTOMERS: string = this.BASE_URL + APIPath.Customer
    static DELETE_CUSTOMERS: string = this.BASE_URL + APIPath.Customer
    static CUSTOMER_EXPORT_EXCEL: string = this.BASE_URL + APIPath.Customer + '/export/excel'

    // Approval
    static GET_APPROVAL: string = this.BASE_URL + APIPath.Approval
    static GET_APPROVALS: string = this.BASE_URL + APIPath.Approval
    static CREATE_APPROVAL: string = this.BASE_URL + APIPath.Approval
    static UPDATE_APPROVAL: string = this.BASE_URL + APIPath.Approval
    static DELETE_APPROVAL: string = this.BASE_URL + APIPath.Approval
    static UPDATE_APPROVAL_RANGE: string = this.BASE_URL + APIPath.Approval + '/range'
    static APPROVAL_EXPORT_EXCEL: string = this.BASE_URL + APIPath.Approval + '/export/excel'
    static APPROVAL_EXPORT_PDF: string = this.BASE_URL + APIPath.Approval + '/export/pdf'
    
    // Item
    static GET_ITEMS_BY_APPROVAL: string = this.BASE_URL + APIPath.Item + '/approval'
    static GET_ITEMS_BY_INVOICE: string = this.BASE_URL + APIPath.Item + '/invoice'
    static CREATE_ITEM_RANGE: string = this.BASE_URL + APIPath.Item + '/range'
    static UPDATE_ITEM_RANGE: string = this.BASE_URL + APIPath.Item + '/range'
    static DELETE_ITEM_RANGE: string = this.BASE_URL + APIPath.Item + '/range'
    
    // Invoice
    static GET_INVOICE: string = this.BASE_URL + APIPath.Invoice
    static GET_INVOICES: string = this.BASE_URL + APIPath.Invoice
    static CREATE_INVOICE: string = this.BASE_URL + APIPath.Invoice
    static UPDATE_INVOICE: string = this.BASE_URL + APIPath.Invoice
    static DELETE_INVOICE: string = this.BASE_URL + APIPath.Invoice
    static INVOICE_EXPORT_EXCEL: string = this.BASE_URL + APIPath.Invoice + '/export/excel'
    static INVOICE_EXPORT_PDF: string = this.BASE_URL + APIPath.Invoice + '/export/pdf'
    static INVOICE_MARK_PENDING: string = this.BASE_URL + APIPath.Invoice + '/mark/pending'
}