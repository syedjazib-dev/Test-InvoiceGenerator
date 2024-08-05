import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly REMEMBER_EMAIL_STORAGE_KEY : string = "RememberedEmail"
  private readonly USERID_STORAGE_KEY : string = "UserId"

  getRememberEmail(){
    return localStorage.getItem(this.REMEMBER_EMAIL_STORAGE_KEY)
  }

  setRememberEmail(email : string){
    return localStorage.setItem(this.REMEMBER_EMAIL_STORAGE_KEY, email)
  }

  setUserId(userId :string){
    return localStorage.setItem(this.USERID_STORAGE_KEY, userId)
  }

  getUserId(){
    return localStorage.getItem(this.USERID_STORAGE_KEY)
  }
 
  removeUserId(){
    return localStorage.removeItem(this.USERID_STORAGE_KEY)
  }

}
