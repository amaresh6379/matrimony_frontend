import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../auth.service';
import { SignupService } from '../signup.service';

@Component({
    selector: 'app-profile-details',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule
    ],
    templateUrl: './profile-details.component.html',
    styleUrl: './profile-details.component.scss'
})
export class ProfileDetailsComponent implements OnInit {
    private router = inject(Router);
    private authService = inject(AuthService);
    private signupService = inject(SignupService);
    private route = inject(ActivatedRoute);

    profile: any = null;

    get isLoggedIn() {
        return this.authService.isLoggedIn();
    }

    ngOnInit() {
        if (this.route.snapshot.params['id']) {
            this.loadProfileDetails(this.route.snapshot.params['id']);
        } else {
            // Redirect to profile list if no profile data is supplied
            this.router.navigate(['/profiles']);
        }
    }

    goBack() {
        this.router.navigate(['/profiles']);
    }

    sendInterest() {
        if (this.isLoggedIn && this.profile && this.profile.dbId) {
            const loggedInUserId = this.authService.currentUser()?.id;
            if (!loggedInUserId) return;

            this.signupService.sendInterest(this.profile.dbId, loggedInUserId).subscribe({
                next: (res) => {
                    this.profile.interestSent = true;
                    alert(res.message || `Interest sent to ${this.profile.name}!`);
                    // Refresh sent list cache to get mobile number if available
                    this.signupService.getSentInterests(loggedInUserId).subscribe((r: any) => {
                        const sentInterests = r.result || [];
                        const sentMatch = sentInterests.find((x: any) => x.likedProfileId === this.profile.dbId);
                        if (sentMatch && sentMatch.Receiver?.mobileNumber) {
                            this.profile.mobileNumber = sentMatch.Receiver.mobileNumber;
                        }
                    });
                },
                error: (err) => {
                    console.error(err);
                    alert('Failed to send interest. Please try again.');
                }
            });
        } else {
            this.router.navigate(['/signup']);
        }
    }

    editMyProfile() {
        if (this.isLoggedIn) {
            this.router.navigate(['/register']);
        }
    }

    toggleLogin() {
        if (this.isLoggedIn) {
            this.authService.logout();
            this.router.navigate(['/profiles']);
        } else {
            this.router.navigate(['/login']);
        }
    }

    navigateToRegister() {
        this.router.navigate(['/signup']);
    }

    loadProfileDetails(id: number) {
        this.signupService.getProfileDetails(id).subscribe({
            next: (res) => {
                this.profile = res.result;
            },
            error: (err) => {
                console.error(err);
                alert('Failed to load profile details. Please try again.');
            }
        });

    }
    getAge(dob: string): number | string {
        if (!dob) return '-';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
}
