import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dot-wave-loader',
  templateUrl: './dot-wave-loader.component.html',
  styleUrls: ['./dot-wave-loader.component.css']
})
export class DotWaveLoaderComponent {
  @Input() colorCode = "#FFF"

  getBg(){
    return `background: ${this.colorCode} 0%   50%, ${this.colorCode} 50%  50%, ${this.colorCode} 100% 50%;`
  }
}
