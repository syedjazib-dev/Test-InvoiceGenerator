import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingDropdownComponent } from './floating-dropdown.component';

describe('FloatingDropdownComponent', () => {
  let component: FloatingDropdownComponent;
  let fixture: ComponentFixture<FloatingDropdownComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FloatingDropdownComponent]
    });
    fixture = TestBed.createComponent(FloatingDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
