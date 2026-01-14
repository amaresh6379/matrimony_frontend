import { Routes } from '@angular/router';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { ProfileListComponent } from './profile-list/profile-list.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignupComponent } from './signup/signup.component';

export const routes: Routes = [
    { path: '', component: ProfileListComponent },
    { path: 'login', component: SignInComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'register', component: RegistrationFormComponent },
    { path: 'profiles', component: ProfileListComponent } // Keep alias if needed
];
