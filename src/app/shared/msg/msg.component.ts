import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { MsgService } from 'src/app/services/msg.service';
import { Color } from 'src/assets/static_data/Color';

@Component({
  selector: 'app-msg',
  templateUrl: './msg.component.html',
  styleUrls: ['./msg.component.css']
})
export class MsgComponent implements OnInit, OnDestroy {
  @Input() MsgBoxId = ""
  isCloseing = false
  closeCall = true
  closingSignal = new Subject<boolean>
  Color = Color

  constructor(public msgService: MsgService) {
    this.closingSignal.pipe(debounceTime(5000)).subscribe(closingSignal => {
      this.closeMsgBox()
    });
  }

  ngOnInit(): void {
    this.msgService.register(this.MsgBoxId)

  }

  ngOnDestroy(): void {
    this.msgService.unregister(this.MsgBoxId)
  }

  get bgColor() {
    if(this.closeCall){
      this.closeMsgBoxAfterTiming()
      this.closeCall = false
    }
    return `bg-${this.msgService.getColor(this.MsgBoxId)}`
  }

  closeMsgBoxAfterTiming() {
   this.closingSignal.next(true)
  }

  closeMsgBox() {
    this.isCloseing = true;
    setTimeout(() => {
      this.isCloseing = false;
      this.msgService.closeMsgBox(this.MsgBoxId)
      this.closeCall = true
    }, 450);
  }
}

