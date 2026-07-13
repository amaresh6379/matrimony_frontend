import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../auth.service';
import { SignupService } from '../signup.service';

@Component({
    selector: 'app-profile-details',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule
    ],
    templateUrl: './profile-details.component.html',
    styleUrl: './profile-details.component.scss'
})
export class ProfileDetailsComponent implements OnInit {
    private router = inject(Router);
    private authService = inject(AuthService);
    private signupService = inject(SignupService);
    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);

    profile: any = null;
    isOwnProfile = false;
    editingSection: string | null = null;
    saving = false;

    // Master data for zodiac/star dropdowns
    zodiacList: any[] = [];
    starList: any[] = [];

    // Image upload state
    selectedImageFile: File | null = null;
    imagePreviewUrl: string | null = null;
    uploadingImage = false;

    get isLoggedIn() {
        return this.authService.isLoggedIn();
    }

    basicForm = this.fb.group({
        name: ['', Validators.required],
        gender: ['', Validators.required],
        religion: ['', Validators.required],
    });

    personalForm = this.fb.group({
        height: [''],
        weight: [''],
        skinTone: [''],
        foodOption: [''],
        asset: [''],
        Interest: ['']
    });

    careerForm = this.fb.group({
        profession: [''],
        companyName: [''],
        workLocation: [''],
        monthyIncome: [''],
        educationDetails: ['']
    });

    familyForm = this.fb.group({
        fatherName: [''],
        fatherMobileNumber: [''],
        motherName: [''],
        motherMobileNumber: [''],
        siblingMale: [''],
        siblingFemale: [''],
        marriedMale: [''],
        marriedFemale: ['']
    });

    zodiacForm = this.fb.group({
        zodiacId: [''],
        starId: [''],
        patham: [''],
        dosham: ['']
    });

    ngOnInit() {
        if (this.route.snapshot.params['id']) {
            this.loadProfileDetails(this.route.snapshot.params['id']);
            this.loadMasterLists();
        } else {
            this.router.navigate(['/profiles']);
        }
    }

    // Rename these two to whatever your existing registration flow calls for zodiac/star master data
    loadMasterLists() {
        this.signupService.getZodiacs().subscribe({
            next: (res: any) => this.zodiacList = res.result || [],
            error: (err: any) => console.error('Error loading zodiac list', err)
        });
        this.signupService.getStars().subscribe({
            next: (res: any) => this.starList = res.result || [],
            error: (err) => console.error('Error loading star list', err)
        });
    }

    loadProfileDetails(id: number) {
        this.signupService.getProfileDetails(id).subscribe({
            next: (res) => {
                this.profile = res.result;
                console.log("this.authService.currentUser()?.id", this.authService.currentUser()?.id);
                this.isOwnProfile = this.isLoggedIn &&
                    this.authService.currentUser()?.id === this.profile.id;
                console.log("isOwnProfile", this.isOwnProfile);
                this.patchForms();
            },
            error: (err) => {
                console.error(err);
                alert('Failed to load profile details. Please try again.');
            }
        });
    }

    patchForms() {
        const personal = this.profile.personalDetails?.[0] || {};
        const career = this.profile.careerDetails?.[0] || {};
        const parent = this.profile.parentDetails?.[0] || {};
        const zodiac = this.profile.zodiacDetails?.[0] || {};

        this.basicForm.patchValue({
            name: this.profile.name,
            gender: this.profile.gender,
            religion: this.profile.religion
        });

        this.personalForm.patchValue(personal);

        this.careerForm.patchValue({
            ...career,
            educationDetails: Array.isArray(career.educationDetails)
                ? career.educationDetails.join(', ')
                : career.educationDetails
        });

        this.familyForm.patchValue(parent);

        this.zodiacForm.patchValue({
            zodiacId: zodiac.zodiac?.id ?? zodiac.zodiacId,
            starId: zodiac.star?.id ?? zodiac.starId,
            patham: zodiac.patham,
            dosham: zodiac.dosham
        });
    }

    startEdit(section: string) {
        if (!this.isOwnProfile) return;
        this.editingSection = section;
    }

    cancelEdit() {
        this.patchForms();
        this.editingSection = null;
    }

    saveSection(section: string) {
        const id = this.profile.id;
        this.saving = true;

        const requests: Record<string, () => any> = {
            basic: () => this.signupService.updateProfileDetails(id, this.basicForm.value),
            personal: () => this.signupService.updateProfilePersonal(id, this.personalForm.value),
            career: () => this.signupService.updateProfileCareer(id, {
                ...this.careerForm.value,
                educationDetails: (this.careerForm.value.educationDetails as string)
                    ?.split(',').map(s => s.trim()).filter(Boolean)
            }),
            family: () => this.signupService.updateProfileFamily(id, this.familyForm.value),
            zodiac: () => this.signupService.updateProfileZodiac(id, this.zodiacForm.value),
        };

        requests[section]().subscribe({
            next: () => {
                this.saving = false;
                this.editingSection = null;
                this.loadProfileDetails(id);
            },
            error: (err: any) => {
                this.saving = false;
                console.error(err);
                alert('Failed to save changes. Please try again.');
            }
        });
    }

    // ---- Image upload ----
    onImageSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.selectedImageFile = input.files[0];
            const reader = new FileReader();
            reader.onload = () => this.imagePreviewUrl = reader.result as string;
            reader.readAsDataURL(this.selectedImageFile);
        }
    }

    cancelImageEdit() {
        this.selectedImageFile = null;
        this.imagePreviewUrl = null;
    }

    // Adjust getUploadUrl to match your existing presigned-URL method name from the S3 flow you already built
    uploadImage() {
        if (!this.selectedImageFile || !this.profile) return;
        this.uploadingImage = true;
        const file = this.selectedImageFile;

        this.signupService.getSignedUrl('profile/profileimage', this.profile.matrimonyId, file.type).subscribe({
            next: (res: any) => {
                const { signedUrl, publicUrl } = res.result;
                fetch(signedUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type }
                }).then(() => {
                    this.signupService.updateProfileImage(this.profile.id, { profileUrl: publicUrl }).subscribe({
                        next: () => {
                            this.uploadingImage = false;
                            this.cancelImageEdit();
                            this.loadProfileDetails(this.profile.id);
                        },
                        error: (err: any) => {
                            this.uploadingImage = false;
                            console.error(err);
                            alert('Failed to save image. Please try again.');
                        }
                    });
                }).catch((err) => {
                    this.uploadingImage = false;
                    console.error(err);
                    alert('Upload failed. Please try again.');
                });
            },
            error: (err: any) => {
                this.uploadingImage = false;
                console.error(err);
                alert('Failed to prepare upload. Please try again.');
            }
        });
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