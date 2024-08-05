import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
export class InputComponent {
@Input() label = ''

  @Input() control : FormControl = new FormControl()
  @Input() type  = 'text'
  @Input() placeholder = ''
  @Input() format = ''
  @Input() autocomplete = ''
  @Input() name = ''

  @Input() postfixIcon = ''
  @Input() prefixIcon = ''
  @Input() postfixText = ''
  @Input() prefixText = ''
  @Input() min = ''
  @Input() max = ''

  @Input() value = ''
  @Input() isRequired = false

  @Input() error = false
  @Input() errorMessage = ''

  showError = false
}
