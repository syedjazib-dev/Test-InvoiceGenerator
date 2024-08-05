import { TestBed } from '@angular/core/testing';

import { ApprovalItemsService } from './approval-items.service';

describe('ApprovalItemsService', () => {
  let service: ApprovalItemsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApprovalItemsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
