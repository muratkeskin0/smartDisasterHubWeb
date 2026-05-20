import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterModule, TranslocoPipe],
  templateUrl: './app-public-footer.html',
  styleUrl: './app-public-footer.css'
})
export class AppPublicFooterComponent {
  readonly year = new Date().getFullYear();
  readonly contactEmail = 'contact@smartdisasterhub.com';
}
