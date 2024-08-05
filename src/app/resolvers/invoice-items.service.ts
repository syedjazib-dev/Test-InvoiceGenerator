import { Injectable } from '@angular/core';
import { ItemService } from '../services/item.service';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import IItem from '../models/item.model';
import { take } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ItemStatus } from 'src/assets/static_data/Status/ItemStatus';
import { ApprovalStatus } from 'src/assets/static_data/Status/ApprovalStatus';

@Injectable({
  providedIn: 'root'
})
export class InvoiceItemsService {
  constructor(
    private  itemService : ItemService,
    private router : Router
  ) { }

  resolve: ResolveFn<IItem[] | null> = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const id = atob(route.params['id'])
    if (!id || id == '') {
      return null
    }
    const path = route.routeConfig?.path
    const pathCheck = path?.split('/')[0]
    var params
    if (pathCheck?.includes('view')) {
      params = new HttpParams({
        fromObject: { 'statusToExclude': [ItemStatus.Splitted, ItemStatus.Returned] }
      });
    } else {
      params = null
    }
    var data : any = null
    data = await new Promise(resolve => {
      this.itemService.getAllByInvoice(Number(id), params ).pipe(
        take(1)
      ).subscribe(
        (response)=>{
          console.log(response)
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
    return data as IItem[]
  }
}
