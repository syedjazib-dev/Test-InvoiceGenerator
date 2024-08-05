import { Injectable } from '@angular/core';
import IItem from '../models/item.model';
import { APIService } from './api.service';
import { API } from 'src/assets/static_data/API';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ItemService {

  constructor(
    private apiServices: APIService
  ) {
  }

  public updateRange(entityList: IItem[]) :Observable<any> {
    return this.apiServices.put(API.UPDATE_ITEM_RANGE, entityList ,{ withCredentials: true})
  }

  public createRange(entityList: IItem[]) :Observable<any> {
    return this.apiServices.post(API.CREATE_ITEM_RANGE, entityList ,{ withCredentials: true})
  }

  public deleteRange(entityList: IItem[]) :Observable<any> {
    return this.apiServices.delete(API.DELETE_ITEM_RANGE, { withCredentials: true, body:entityList })
  }

  public getAllByInvoice(id: number, params : any) {
    return this.apiServices.get(API.GET_ITEMS_BY_INVOICE + '/' + id,{ withCredentials: true, params})
  }

  public getAllByApproval(id: number, params : any) {
    return this.apiServices.get(API.GET_ITEMS_BY_APPROVAL + '/' + id,{ withCredentials: true, params})
  }
}

