  import { NgModule } from '@angular/core';
  import { BrowserModule } from '@angular/platform-browser';

  import { AppRoutingModule } from './app-routing.module';
  import { AppComponent } from './app.component';
  import { HomeComponent } from './home/home.component';
  import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
  import { SharedModule } from './shared/shared.module';
  import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';



  @NgModule({
    declarations: [
      AppComponent,
      HomeComponent,
    ],
    imports: [
      BrowserModule,
      AppRoutingModule,
      BrowserAnimationsModule,
      SharedModule,
      HttpClientModule  
    ],
    providers: [],
    bootstrap: [AppComponent]
  })
  export class AppModule { }
