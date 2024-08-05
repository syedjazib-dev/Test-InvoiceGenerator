import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import Alert from 'src/app/models/Alert.model';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {
  @Output() closeAlertBox = new EventEmitter<void>();

  alert? : Alert
  constructor(private alertService : AlertService){}

  get bgColor() {
    return `bg-${this.alert?.okBtnColor}`
  }

  ngOnInit(): void {
    this.alertService.getAlert().subscribe(alert=>{
      this.alert = alert
    })
  }

  isAlertBoxClosed = true;
  onCloseAlertBox() {
    this.isAlertBoxClosed = false; // Set to false to trigger closing animation
    setTimeout(() => {
      this.isAlertBoxClosed = true;
      this.alert = undefined
    }, 450);
  }

  onOk(event : Event): void {
    event.preventDefault()  
    // Emit the Ok clicked event
    this.alertService.emitOkClicked();
    this.onCloseAlertBox()
  }

  onCancel(event : Event): void {
    event.preventDefault()
    // Emit the Ok clicked event
    this.alertService.emitCancelClicked();
    this.onCloseAlertBox()
  }

}
