import { Component, HostListener } from '@angular/core';
import { AuthService } from './services/auth.service';
import { FloatingDropdownService } from './services/floating-dropdown.service';
import { DatePipe } from '@angular/common';
import { ApprovalService } from './services/approval.service';
import { InvoiceService } from './services/invoice.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers:[DatePipe]
})
export class AppComponent {
  title = 'InvoiceGenerator';

  constructor(
    private floatingDropdown: FloatingDropdownService,
    private authService : AuthService
  ){
    authService.init()
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!(event.target as HTMLElement).classList.contains('floating-dropdown-btn')) {
      this.floatingDropdown.closeAllFloatingDropdown()
    }
      window.onscroll = function () { };
  }
}
