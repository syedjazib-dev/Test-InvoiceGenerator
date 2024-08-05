import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { FloatingDropdownService } from 'src/app/services/floating-dropdown.service';
import { FloatingModalService } from 'src/app/services/floating-modal.service';

@Component({
  selector: 'app-pagination-bar',
  templateUrl: './pagination-bar.component.html',
  styleUrls: ['./pagination-bar.component.css']
})
export class PaginationBarComponent {

  constructor(
    private router : Router,
    private floatingDropdown : FloatingDropdownService
  ){}


  @Input() recordPerPageOptions = [10]
  @Input() recordPerPage = 10
  @Input() pageNo = 1
  @Input() totalPageCount = 1
  @Input() disableFlag = false

  recordPerPageId = "recordPerPageId"

  // Paggination

  changeRecordPerPage(recordPerPage: number) {
    this.router.navigate([],
      {
        queryParams: {
          recordPerPage: recordPerPage,
          pageNo: 1,
        },
        queryParamsHandling: 'merge',
      })
  }

  nextPage() {
    if ((this.totalPageCount <= this.pageNo) || this.disableFlag) {
      return
    }
    this.router.navigate([],
      {
        queryParams: {
          pageNo: ++this.pageNo,
        },
        queryParamsHandling: 'merge',
      })
  }

  previousPage() {
    if (this.pageNo <= 1 || this.disableFlag) {
      return
    }
    this.router.navigate([],
      {
        queryParams: {
          pageNo: --this.pageNo,
        },
        queryParamsHandling: 'merge',
      })
  }

  openFloatingDropdown(event: Event, id: string) {
    event.preventDefault();
    this.floatingDropdown.toggeleFloatingDropdown(id)
  }

}
