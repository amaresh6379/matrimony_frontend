import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { filter } from 'rxjs';

declare let gtag: Function;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RegistrationFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Vaniya Chettiyar Kalyana Malai';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        gtag('config', 'G-Q6DTY24EXF', {
          page_path: event.urlAfterRedirects
        });
      });
  }
}