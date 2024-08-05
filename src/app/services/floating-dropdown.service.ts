import { Injectable } from '@angular/core';

interface IFloatingDropdown {
  Id: string
  Visible: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class FloatingDropdownService {
  private FDs: IFloatingDropdown[] = [];

  constructor() { }

  register(Id: string) {
    this.FDs.push({
      Id: Id,
      Visible: false
    })
  }

  unregister(Id: string) {
    this.FDs = this.FDs.filter(element => element.Id !== Id)
  }

  getInstace(Id : string){
    return this.FDs.find(element => element.Id == Id)
  }

  isFloatingDropdownOpen(Id: string): boolean {
    return Boolean(this.FDs.find(element => element.Id === Id)?.Visible)
  }

  closeAllFloatingDropdown(){
    for(let i = 0; i < this.FDs.length; i++){
      this.FDs[i].Visible = false
    }
  }

  toggeleFloatingDropdown(Id: string, top?: number, left?: number) {
    var FD = this.FDs.find(element => element.Id === Id)
    for(let i = 0; i < this.FDs.length; i++){
      if(this.FDs[i] == FD){
        continue
      }
      this.FDs[i].Visible = false
    }
    if (FD) {
      FD.Visible = !FD.Visible
    }
  }
}
