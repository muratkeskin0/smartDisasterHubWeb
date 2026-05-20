import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';

import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher';

import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo';

import { AppPublicFooterComponent } from '../../../shared/components/app-public-footer/app-public-footer';

import { MAIN_PAGE_IMAGE_1, MAIN_PAGE_IMAGE_2 } from '../../../constants/branding';



@Component({

  selector: 'app-landing',

  standalone: true,

  imports: [

    CommonModule,

    RouterModule,

    TranslocoPipe,

    LanguageSwitcherComponent,

    AppLogoComponent,

    AppPublicFooterComponent

  ],

  templateUrl: './landing.html',

  styleUrl: './landing.css'

})

export class LandingComponent {

  readonly mainPageImage1 = MAIN_PAGE_IMAGE_1;

  readonly mainPageImage2 = MAIN_PAGE_IMAGE_2;



  /** 0 = intro, 1 = image1, 2 = image2 (touch) */
  peeled = 0;

  peelTo(level: number): void {
    this.peeled = Math.max(this.peeled, Math.min(level, 2));
  }

}

