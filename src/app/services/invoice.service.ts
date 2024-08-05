import { Injectable } from "@angular/core"
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from "@angular/router"
import { ApprovalService } from "./approval.service"
import { APIService } from "./api.service"
import IInvoice from "../models/invoice.model"
import { Observable, take } from "rxjs"
import { API } from "src/assets/static_data/API"
import { HttpHeaders } from "@angular/common/http"

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  constructor(
    private router: Router,
    private approvalService: ApprovalService,
    private apiServices :  APIService
  ) {
  }


  public create(customer: IInvoice) : Observable<any>  {
    return this.apiServices.post(API.CREATE_INVOICE,customer,{ withCredentials: true })
  }

  public update(customer: IInvoice) : Observable<any> {
    return this.apiServices.put(API.UPDATE_INVOICE,customer,{ withCredentials: true })
  }

  public markPending(id: number) : Observable<any> {
    return this.apiServices.put(API.INVOICE_MARK_PENDING + '/' + id,{},{ withCredentials: true })
  }


  public delete(id: number) : Observable<any> {
    return this.apiServices.delete(API.DELETE_INVOICE + '/' + id,  { withCredentials: true})
  }

  public get(id: number) :Observable<any> {
    return this.apiServices.get(API.GET_INVOICE + '/' + id, { withCredentials: true})
  }


  public getAll(params : any) : Observable<any> {
    return this.apiServices.get(API.GET_INVOICES, { withCredentials: true, params })
  }

  public exportAsExcel() : Observable<any> {
    return this.apiServices.get(API.INVOICE_EXPORT_EXCEL, { withCredentials: true, observe : 'response', responseType :'blob' })
  }

  public exportPDF(id: number, body :{}) : Observable<any> {
    var headers = new HttpHeaders()
    headers.append('reciever' , body['reciever'])

    return this.apiServices.get(API.INVOICE_EXPORT_PDF + '/' + id, { 
      headers: new HttpHeaders()
      .append('reciever' , body['reciever'])
      .append('terms' , body['terms'])
      .append('salesman' , body['salesman'])
      .append('remarks' , body['remarks']),
      withCredentials: true,
      observe : 'response',
       responseType :'blob'
    })
  }

  resolve: ResolveFn<IInvoice | null> = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const id = atob(route.params['id'])
    if (!id || id == '') {
      return null
    }
    var data : any = null
    data = await new Promise(resolve => {
      this.get(Number(id)).pipe(
        take(1)
      ).subscribe(
        (response)=>{
          if(response.isSuccess){
              resolve(response.data)
          }
        },
        (error)=>{
          this.router.navigate(['/invoices'])
        }
      )
    })
  
    if (!data || data.length == 0) {
      this.router.navigate(['/invoices'])
      return null
    }
    return data as IInvoice
  }
}
