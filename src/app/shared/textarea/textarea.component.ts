import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.css']
})
export class TextareaComponent {
  @Input() label = ''

  @Input() control : FormControl = new FormControl()
  @Input() placeholder = ''
  @Input() format = ''
  @Input() autocomplete = ''
  @Input() name = ''

  @Input() postfixIcon = ''
  @Input() prefixIcon = ''
  @Input() postfixText = ''
  @Input() prefixText = ''

  @Input() value = ''
  @Input() isRequired = false

  showError = false
}
