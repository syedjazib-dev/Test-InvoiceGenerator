import { Component, ElementRef, Input } from '@angular/core';
import { FloatingModalService } from 'src/app/services/floating-modal.service';

@Component({
  selector: 'app-floating-modal',
  templateUrl: './floating-modal.component.html',
  styleUrls: ['./floating-modal.component.css']
})
export class FloatingModalComponent {
  @Input() floatingModalId  = "";
  @Input() title  = "";

  constructor( public floatingMoadal : FloatingModalService, public el : ElementRef){}
  
  ngOnInit(): void {
      this.floatingMoadal.register(this.floatingModalId)

  }

  ngOnDestroy(): void {
      this.floatingMoadal.unregister(this.floatingModalId)
    }

  isFloatingModalClosed = true;
  closeFloatingModal(){
        this.isFloatingModalClosed = false; // Set to false to trigger closing animation
        setTimeout(() => {
          this.floatingMoadal.closeFloatingModal(this.floatingModalId)
          this.isFloatingModalClosed = true; // Set to true after the animation finishes
        },450);
  }

}
