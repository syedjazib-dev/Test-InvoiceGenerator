import { TestBed } from '@angular/core/testing';

import { FloatingModalService } from './floating-modal.service';

describe('FloatingModalService', () => {
  let service: FloatingModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FloatingModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
