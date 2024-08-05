import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalViewComponent } from './approval-view.component';

describe('ApprovalViewComponent', () => {
  let component: ApprovalViewComponent;
  let fixture: ComponentFixture<ApprovalViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ApprovalViewComponent]
    });
    fixture = TestBed.createComponent(ApprovalViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
