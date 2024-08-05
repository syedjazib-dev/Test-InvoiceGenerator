import { Injectable } from '@angular/core';
import ICustomer from '../models/customer.model';
import { Observable } from 'rxjs';
import { APIService } from './api.service';
import { API } from 'src/assets/static_data/API';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  constructor(
    private apiServices : APIService
  ) {}

  public create(customer: ICustomer) : Observable<any>  {
    return this.apiServices.post(API.CREATE_CUSTOMERS,customer,{ withCredentials: true })
  }

  public update(customer: ICustomer) : Observable<any> {
    return this.apiServices.put(API.UPDATE_CUSTOMERS,customer,{ withCredentials: true })
  }

  public delete(customerId: number) : Observable<any> {
    return this.apiServices.delete(API.DELETE_CUSTOMERS + '/' + customerId,{ withCredentials: true })
  }

  public getAll(params : any) : Observable<any> {
    return this.apiServices.get(API.GET_CUSTOMERS, { withCredentials: true, params })
  }

  public exportAsExcel() : Observable<any> {
    return this.apiServices.get(API.CUSTOMER_EXPORT_EXCEL, { withCredentials: true, observe : 'response', responseType :'blob' })
  }
}
