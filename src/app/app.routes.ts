import { Routes } from '@angular/router';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { ProfileListComponent } from './profile-list/profile-list.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { ProfileDetailsComponent } from './profile-details/profile-details.component';

export const routes: Routes = [
    { path: '', component: ProfileListComponent },
    { path: 'login', component: SignInComponent },
    { path: 'signup', component: RegistrationFormComponent, data: { isSignupMode: true } },
    { path: 'register', component: RegistrationFormComponent, data: { isSignupMode: false } },
    { path: 'profiles', component: ProfileListComponent }, // Keep alias if needed
    { path: 'profile-details/:id', component: ProfileDetailsComponent }
];
