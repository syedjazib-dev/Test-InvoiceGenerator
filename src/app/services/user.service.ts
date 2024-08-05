import { Injectable } from '@angular/core';
import IUser from '../models/user.model';
import { Observable } from 'rxjs';
import { API } from 'src/assets/static_data/API';
import { APIService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private apiServices : APIService
  ) {}

  public update(user: IUser) : Observable<any> {
    return this.apiServices.put(API.UPDATE_USER,user,{ withCredentials: true })
  }

  public create(user: IUser) : Observable<any>  {
    return this.apiServices.post(API.CREATE_USER,user,{ withCredentials: true })
  }

  public disable(userId: string) : Observable<any> {
    return this.apiServices.get(API.DEACTIVE_USER + '/' + userId,{ withCredentials: true })
  }

  public enable(userId: string) : Observable<any> {
    return this.apiServices.get(API.ACTIVE_USER + '/' + userId,{ withCredentials: true })
  }

  public getAll(params : any) : Observable<any> {
    return this.apiServices.get(API.GET_USERS, { withCredentials: true, params })
  }

  public exportAsExcel() : Observable<any> {
    return this.apiServices.get(API.USER_EXPORT_EXCEL, { withCredentials: true, observe : 'response', responseType :'blob' })
  }
}
