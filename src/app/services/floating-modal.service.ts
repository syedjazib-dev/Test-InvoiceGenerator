import { Injectable } from '@angular/core';

interface iFloatingModal {
  Id: string
  Visible: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class FloatingModalService {
  private FMs: iFloatingModal[] = [];

  constructor() { }

  register(Id: string) {
    this.FMs.push({
      Id: Id,
      Visible: false
    })
  }

  unregister(Id: string) {
    this.FMs = this.FMs.filter(element => element.Id !== Id)
  }

  isFloatingModalOpen(Id: string): boolean {
    return Boolean(this.FMs.find(element => element.Id === Id)?.Visible)
  }

  openFloatingModal(Id: string) {
    var FM = this.FMs.find(element => element.Id === Id)
    if (FM) {
      FM.Visible = true
    }
  }

  closeFloatingModal(Id: string) {
    var FM = this.FMs.find(element => element.Id === Id)
    if (FM) {
      FM.Visible = false
    }
  }
}
