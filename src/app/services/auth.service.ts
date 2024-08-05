import { Injectable } from '@angular/core';
import IUser from '../models/user.model';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, take } from 'rxjs';
import { API } from 'src/assets/static_data/API';
import { APIService } from './api.service';
import { StorageService } from './storage.service';
import { Color } from 'src/assets/static_data/Color';
import { MsgService } from './msg.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private router: Router,
    private apiServices: APIService,
    private storageService: StorageService,
    private msgService : MsgService
  ) {
  }

  stopIsAuthInterval: Function = () => { }
  msgBoxId = 'appMsg'


  init(){
    const isAuthInterval = setInterval(() =>this.isAuthenticated(), 900000)

    this.stopIsAuthInterval = () => {
      clearInterval(isAuthInterval)
    }
  }

  get(id : string){
    return  this.apiServices.get(API.GET_USER + '/' + id, { withCredentials: true })
  }

  login(email: string, password: string): Observable<any> {
    return this.apiServices.post(API.LOGIN, { email: email, password: password }, { withCredentials: true })
  }

  public async isAuthenticated() {
    try {
      return new Promise(resolve => {
        this.apiServices.get(API.REFRESH_TOKEN, { withCredentials: true }).pipe(
          take(1)
        ).subscribe(
          (response) => {
            resolve(response.isSuccess);
          })
      })

    } catch (e) {
      return false
    }
  }


  public async logout($event?: Event) {
    if ($event) {
      $event.preventDefault()
    }
    this.storageService.removeUserId()
    this.stopIsAuthInterval()
    this.apiServices.get(API.LOGOUT, { withCredentials: true }).subscribe(
      (response) => {
        if (response.isSuccess) {   
          this.msgService.setColor(this.msgBoxId, Color.success)
          this.msgService.setMsg(this.msgBoxId, 'Logout successfuly.')
          this.msgService.openMsgBox(this.msgBoxId)
          this.router.navigate(['login'])
        }
      })
  }

  resolve: ResolveFn<IUser | null> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {

    var userId = this.storageService.getUserId();
    if (!userId) {
      this.router.navigate(['/login'])
      return null
    }

    try {

      return new Promise(resolve => {
     this.get(userId!).pipe(
        take(1)
      ).subscribe(
        (response) => {
          if (response.isSuccess) {
            resolve(response.data);
          }
        },
        (error) => {
          this.router.navigate(['/login'])
          resolve(null)
        }
      )
    })
    } catch (e) {
      if (environment.isDevMode) {
            console.log(e)
          }
      this.router.navigate(['/login'])
      return null
    }
  }
}
