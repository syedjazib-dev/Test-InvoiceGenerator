import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-tag',
  templateUrl: './status-tag.component.html',
  styleUrls: ['./status-tag.component.css']
})
export class StatusTagComponent {
  @Input() color = ""
  @Input() status = ""

  public get borderColor() : string {
    return `border-${this.color} text-${this.color}`
  }
}
