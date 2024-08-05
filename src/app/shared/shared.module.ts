import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from './input/input.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, provideEnvironmentNgxMask } from 'ngx-mask';
import { DotWaveLoaderComponent } from './dot-wave-loader/dot-wave-loader.component';
import { FloatingDropdownComponent } from './floating-dropdown/floating-dropdown.component';
import { MsgComponent } from './msg/msg.component';
import { FloatingModalComponent } from './floating-modal/floating-modal.component';
import { AlertComponent } from './alert/alert.component';
import { TextareaComponent } from './textarea/textarea.component';
import { PaginationBarComponent } from './pagination-bar/pagination-bar.component';
import { StatusTagComponent } from './status-tag/status-tag.component';

@NgModule({
  declarations: [
    InputComponent,
    DotWaveLoaderComponent,
    FloatingDropdownComponent,
    MsgComponent,
    FloatingModalComponent,
    AlertComponent,
    TextareaComponent,
    PaginationBarComponent,
    StatusTagComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective
  ],
  exports:[
    InputComponent,
    DotWaveLoaderComponent,
    FloatingDropdownComponent,
    MsgComponent,
    FloatingModalComponent,
    AlertComponent,
    TextareaComponent,
    PaginationBarComponent,
    StatusTagComponent,
  ],
  providers:[
    provideEnvironmentNgxMask(),
  ]
})
export class SharedModule { }
