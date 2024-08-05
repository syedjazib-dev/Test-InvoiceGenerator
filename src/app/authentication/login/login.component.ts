import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import IUser from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { MsgService } from 'src/app/services/msg.service';
import { StorageService } from 'src/app/services/storage.service';
import { Color } from 'src/assets/static_data/Color';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private storageService: StorageService,
    private router: Router,
    private msgService: MsgService,
  ) { }

  ngOnInit(): void {
    this.email.setValue(this.storageService.getRememberEmail())
  }

  msgBoxId = 'appMsg'

  isLogingIn: boolean = false

  email = new FormControl('',
    [
      Validators.required,
      Validators.email
    ])
  password = new FormControl('',
    [
      Validators.required
    ])
  rememberMe = new FormControl()

  loginForm = new FormGroup({
    email: this.email,
    password: this.password,
    rememberMe: this.rememberMe
  })

  public async login() {
    if (this.loginForm.valid) {
      this.isLogingIn = true
      try {
        this.authService.login(this.email.value!, this.password.value!).subscribe(
          (response) => {
            if (response.isSuccess) {
            this.storageService.setUserId(response.data)
            if (this.rememberMe.value) {
              this.storageService.setRememberEmail(this.email.value!)
            }
            this.msgService.setColor(this.msgBoxId, Color.success)
            this.msgService.setMsg(this.msgBoxId, 'Login Successfull.')
            this.msgService.openMsgBox(this.msgBoxId)
            this.isLogingIn = false
            this.router.navigate(['invoices'])
          }else{
            this.msgService.setColor(this.msgBoxId, Color.danger)
            if (response.errorMessages && response.errorMessages[0] && response.errorMessages[0] != "") {
              this.msgService.setMsg(this.msgBoxId, response.errorMessages[0])
            } else {
              this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
            }
            this.msgService.openMsgBox(this.msgBoxId)
          }

          this.isLogingIn = false

          },
          (error) => {
            if (environment.isDevMode) {
              console.log(error)
            }
            this.msgService.setColor(this.msgBoxId, Color.danger)
            if (error.error.errorMessages && error.error.errorMessages[0] && error.error.errorMessages[0] != "") {
              this.msgService.setMsg(this.msgBoxId, error.error.errorMessages[0])
            } else {
              this.msgService.setMsg(this.msgBoxId, 'Somthing Is Wrong Try Again Later')
            }
            this.msgService.openMsgBox(this.msgBoxId)

            this.isLogingIn = false
          })
      } catch (e) {
        if (environment.isDevMode) {
            console.log(e)
          }

        this.msgService.setColor(this.msgBoxId, Color.danger)
        this.msgService.setMsg(this.msgBoxId, 'Something is wrong, Try again later.')
        this.msgService.openMsgBox(this.msgBoxId)


        this.isLogingIn = false
        return
      }
    } else {
      Object.keys(this.loginForm.controls).forEach(field => {
        const control = this.loginForm.get(field);
        control!.markAsTouched()
        control!.markAsDirty()
      });
    }

  }

}
