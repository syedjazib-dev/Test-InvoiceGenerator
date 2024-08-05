import { Injectable } from '@angular/core';

interface MsgBox {
  Id: string
  Visible: boolean,
  msg: string,
  color: string
}

@Injectable({
  providedIn: 'root'
})
export class MsgService {
  private MBs: MsgBox[] = [];

  constructor() { }

  register(Id: string) {
    this.MBs.push({
      Id: Id,
      Visible: false,
      msg: '',
      color: ''
    })
  }

  unregister(Id: string) {
    this.MBs = this.MBs.filter(element => element.Id !== Id)
  }

  isMsgBoxOpen(Id: string): boolean {
    return Boolean(this.MBs.find(element => element.Id === Id)?.Visible)
  }

  openMsgBox(Id: string) {
    var MB = this.MBs.find(element => element.Id === Id)
    if (MB) {
      MB.Visible = true
    }
  }


  setColor(Id: string, color : string){
    var MB = this.MBs.find(element => element.Id === Id)
    if(MB){
      MB.color = color
    }
    return ''
  }

  setMsg(Id: string, msg : string){
    var MB = this.MBs.find(element => element.Id === Id)
    if(MB){
      MB.msg = msg
    }
    return ''
  }

  getColor(Id: string){
    var MB = this.MBs.find(element => element.Id === Id)
    if(MB){
      return MB.color
    }
    return ''
  }

  getMsg(Id: string){
    var MB = this.MBs.find(element => element.Id === Id)
    if(MB){
      return MB.msg
    }
    return ''
  }

  closeMsgBox(Id: string) {
    var MB = this.MBs.find(element => element.Id === Id)
    if (MB) {
      MB.Visible = false
    }
  }
}
