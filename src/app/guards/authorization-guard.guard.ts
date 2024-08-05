import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { UserService } from '../services/user.service';
import { UserRole } from 'src/assets/static_data/UserRole';
import { take } from 'rxjs';
import IUser from '../models/user.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationGuard implements CanActivate {
  constructor(private storageService: StorageService, private router: Router, private authService : AuthService) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    var userId =  this.storageService.getUserId()
    if (userId == null) {
      this.router.navigate(['login'])
      return false
    }

    var user :IUser|null = null

    try {

      user = await new Promise(resolve => {
     this.authService.get(userId!).pipe(
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
      return false
    }
    if (user == null) {
      this.router.navigate(['login'])
    }
    if (user!.role != UserRole.admin) {
      this.router.navigate(['invoices'])
      return false
    }
    return true;
  }
}