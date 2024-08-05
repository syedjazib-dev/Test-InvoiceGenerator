import { TestBed } from '@angular/core/testing';

import { InvoiceItemsService } from './invoice-items.service';

describe('InvoiceItemsService', () => {
  let service: InvoiceItemsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvoiceItemsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
