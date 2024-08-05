import { Component, ElementRef, Input } from '@angular/core';
import { FloatingDropdownService } from 'src/app/services/floating-dropdown.service';

@Component({
  selector: 'app-floating-dropdown',
  templateUrl: './floating-dropdown.component.html',
  styleUrls: ['./floating-dropdown.component.css']
})
export class FloatingDropdownComponent {

  @Input() floatingDropdownId  = "";

  constructor( public floatingDropdown : FloatingDropdownService, public el : ElementRef){}
  
  ngOnInit(): void {
      this.floatingDropdown.register(this.floatingDropdownId)

  }

  ngOnDestroy(): void {
      this.floatingDropdown.unregister(this.floatingDropdownId)
    }


  closeFloatingDropdown(){
    this.floatingDropdown.toggeleFloatingDropdown(this.floatingDropdownId)
  }
}
