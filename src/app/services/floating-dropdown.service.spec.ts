import { TestBed } from '@angular/core/testing';

import { FloatingDropdownService } from './floating-dropdown.service';

describe('FloatingDropdownService', () => {
  let service: FloatingDropdownService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FloatingDropdownService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
