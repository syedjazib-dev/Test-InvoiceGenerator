import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import IItem from '../models/item.model';
import { ItemService } from '../services/item.service';
import { take } from 'rxjs';
import { ItemStatus } from 'src/assets/static_data/Status/ItemStatus';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApprovalItemsService {
  constructor(
    private itemService: ItemService,
    private router: Router
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
        fromObject: { 'statusToExclude': [ItemStatus.Splitted] }
      });
    }
    else {
      params = null
    }
    var data: any = null

    data = await new Promise(resolve => {
      this.itemService.getAllByApproval(Number(id), params).pipe(
        take(1)
      ).subscribe(
        (response) => {
          if (response.isSuccess) {
            resolve(response.data)
          }
        },
        (error) => {
          this.router.navigate(['/approvals'])
        }
      )
    })

    if (!data || data.length == 0) {
      this.router.navigate(['/approvals'])
      return null
    }
    return data as IItem[]
  }
}
