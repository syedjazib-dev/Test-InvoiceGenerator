import { EventEmitter, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import Alert from '../models/Alert.model';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private alert$ = new Subject<Alert>()
  onActionClicked: EventEmitter<boolean> = new EventEmitter();

  setAlert(alert :Alert){
    this.alert$.next(alert)
  }

  getAlert(){
    return this.alert$.asObservable()
  }

  emitOkClicked() {
    this.onActionClicked.emit(true);
  }

  emitCancelClicked() {
    this.onActionClicked.emit(false);
  }

}
