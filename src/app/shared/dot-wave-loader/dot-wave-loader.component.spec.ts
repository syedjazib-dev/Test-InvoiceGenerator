import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DotWaveLoaderComponent } from './dot-wave-loader.component';

describe('DotWaveLoaderComponent', () => {
  let component: DotWaveLoaderComponent;
  let fixture: ComponentFixture<DotWaveLoaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DotWaveLoaderComponent]
    });
    fixture = TestBed.createComponent(DotWaveLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
