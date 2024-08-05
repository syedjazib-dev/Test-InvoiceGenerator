import { Component, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import IUser from '../models/user.model';
import { FloatingDropdownService } from '../services/floating-dropdown.service';
import { AuthService } from '../services/auth.service';
import { UserRole } from 'src/assets/static_data/UserRole';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {


  msgBoxId = 'homeMsgBoxId'
  user : IUser = {} as IUser
  UserRole = UserRole

  constructor(
    private route: ActivatedRoute,
    private floatingDropdown: FloatingDropdownService,
    private authService : AuthService,
  ) {
    this.route.data.subscribe(data => {
      this.user = data['user'];
    });
  }

  ProfileDropdownId = "ProfileDropdownId"
  showMenu = false
  isMenuCloseing: boolean = false;
  
  openFloatingDropdown(event: Event, id: string) {
    event.preventDefault();
    this.floatingDropdown.toggeleFloatingDropdown(id)
  }

  openMenu() {
    this.showMenu = true; 
  }

  closeMenu() {
    this.isMenuCloseing = true; 
    setTimeout(() => {
      this.isMenuCloseing = false; 
      this.showMenu = false
    }, 450);
  }

  async logout(event : Event){
    event.preventDefault();
    await this.authService.logout()
    
  }

}
