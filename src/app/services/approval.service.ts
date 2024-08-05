import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, take } from 'rxjs';
import { APIService } from './api.service';
import IApproval from '../models/approval.model';
import { API } from 'src/assets/static_data/API';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApprovalService {

  constructor(
    private apiServices: APIService,
    private router: Router,
  ) {
  }
  public create(customer: IApproval) : Observable<any>  {
    return this.apiServices.post(API.CREATE_APPROVAL,customer,{ withCredentials: true })
  }
  
  public update(customer: IApproval) : Observable<any> {
    return this.apiServices.put(API.UPDATE_APPROVAL,customer,{ withCredentials: true })
  }

  public updateRange(entityList: IApproval[]) {
    return this.apiServices.put(API.UPDATE_APPROVAL_RANGE, entityList,{ withCredentials: true})
  }

  public delete(id: number) : Observable<any> {
    return this.apiServices.delete(API.DELETE_APPROVAL + '/' + id,  { withCredentials: true})
  }

  public get(id: number) :Observable<any> {
    return this.apiServices.get(API.GET_APPROVAL + '/' + id, { withCredentials: true})
  }

  public getAll(params : any) : Observable<any> {
    return this.apiServices.get(API.GET_APPROVALS, { withCredentials: true, params })
  }

  public exportAsExcel() : Observable<any> {
    return this.apiServices.get(API.APPROVAL_EXPORT_EXCEL, { withCredentials: true, observe : 'response', responseType :'blob' })
  }

  public exportPDF(id: number, body :{}) : Observable<any> {
    var headers = new HttpHeaders()
    headers.append('reciever' , body['reciever'])

    return this.apiServices.get(API.APPROVAL_EXPORT_PDF + '/' + id, { 
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


  resolve: ResolveFn<IApproval | null> = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const id = atob(route.params['id'])
    if(!id || id == '' ){
      return null
    }

    var data : any = null
    data = await new Promise(resolve => {
      this.get(Number(id)).pipe(
        take(1)
      ).subscribe(
        (response)=>{
          console.log(response)
          if(response.isSuccess){
              resolve(response.data)
          }
        },
        (error)=>{
          this.router.navigate(['/approvals'])
        }
      )
    })

    console.log(data)
  
    if (!data || data.length == 0) {
      this.router.navigate(['/approvals'])
      return null
    }
    return data as IApproval
  }
}
