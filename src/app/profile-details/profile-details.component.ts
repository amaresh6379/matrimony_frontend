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
import {
    MARITAL_STATUS, RELIGION, DISTRICTS, ZODIAC, STAR, PAATHAM, DOSHAM,
    PROPERTY_VALUE, HEIGHTS, WEIGHTS, COLORS, FOOD_OPTIONS
} from '../registration-form/form-data'; // ADJUST PATH if different

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

    // ---- Static option lists (same source as registration) ----
    maritalStatusOptions = MARITAL_STATUS;
    religionOptions = RELIGION;
    paathamOptions = PAATHAM;
    doshamOptions = DOSHAM;
    propertyValueOptions = PROPERTY_VALUE;
    colorOptions = COLORS;
    foodOptions = FOOD_OPTIONS;

    // ---- Dynamic option lists, replaced once the API responds ----
    districtOptions = DISTRICTS;
    zodiacOptions = ZODIAC;
    starOptions = STAR;
    heightOptions = HEIGHTS;
    weightOptions = WEIGHTS;

    // Raw master rows — needed to convert display-name <-> id, same as registration
    rawDistricts: any[] = [];
    rawZodiacs: any[] = [];
    rawStars: any[] = [];
    rawHeights: any[] = [];
    rawWeights: any[] = [];

    // Image upload state
    selectedImageFile: File | null = null;
    imagePreviewUrl: string | null = null;
    uploadingImage = false;

    // Jathagam upload state
    selectedJathagamFile: File | null = null;
    jathagamPreviewUrl: string | null = null;
    uploadingJathagam = false;

    get isLoggedIn() {
        return this.authService.isLoggedIn();
    }

    // Section getters — ALWAYS return an object (never undefined), so every
    // section block renders even when the profile has no row yet. This is
    // what lets the owner fill in a section that was never created.
    get personal() { return this.profile?.personalDetails?.[0] || {}; }
    get career() { return this.profile?.careerDetails?.[0] || {}; }
    get parent() { return this.profile?.parentDetails?.[0] || {}; }
    get zodiacDetail() { return this.profile?.zodiacDetails?.[0] || {}; }

    private readonly maritalStatusMap: Record<string, string> = {
        'Unmarried': 'UNMARRIED',
        'Divorced': 'DIVORCED',
        'Divorced with Children': 'DIVORCED_WITH_CHILDREN',
        'Widow/Widower': 'WIDOW/WIDOWER',
        'Widow/Widower with Children': 'WIDOW/WIDOWER_WITH_CHILDREN',
        'Separated': 'SEPARATED',
        'Separated with Children': 'SEPARATED_WITH_CHILDREN'
    };

    basicForm = this.fb.group({
        name: ['', Validators.required],
        gender: ['', Validators.required],
        religion: ['', Validators.required],
        maritalStatus: ['', Validators.required],
        nativePlace: ['', Validators.required],
        district: ['', Validators.required],
    });

    personalForm = this.fb.group({
        height: [''],
        weight: [''],
        skinTone: [''],
        foodOption: ['', Validators.required],
        asset: [''],
        Interest: ['']
    });

    careerForm = this.fb.group({
        profession: ['', Validators.required],
        companyName: [''],
        workLocation: [''],
        monthyIncome: [''],
        educationDetails: ['', Validators.required]
    });

    familyForm = this.fb.group({
        fatherName: ['', Validators.required],
        fatherMobileNumber: ['', Validators.pattern('^[0-9]{10}$')],
        motherName: ['', Validators.required],
        motherMobileNumber: ['', Validators.pattern('^[0-9]{10}$')],
        siblingMale: [0],
        siblingFemale: [0],
        marriedMale: [0],
        marriedFemale: [0]
    });

    zodiacForm = this.fb.group({
        zodiacId: ['', Validators.required],
        starId: ['', Validators.required],
        patham: ['', Validators.required],
        dosham: ['', Validators.required]
    });

    ngOnInit() {
        if (this.route.snapshot.params['id']) {
            this.loadMasterLists();
            this.loadProfileDetails(this.route.snapshot.params['id']);
        } else {
            this.router.navigate(['/profiles']);
        }
    }

    loadMasterLists() {
        // ASSUMPTION: getDistricts/getHeights/getWeights exist on SignupService
        // (mirroring getZodiacs/getStars) and return { result: [...] }.
        this.signupService.getDistricts().subscribe({
            next: (res: any) => {
                this.rawDistricts = res || [];
                this.districtOptions = this.rawDistricts.map((d: any) => d.districtName);
                this.patchDependentFields();
            },
            error: (err: any) => console.error('Error loading district list', err)
        });
        this.signupService.getZodiacs().subscribe({
            next: (res: any) => {
                this.rawZodiacs = res || [];
                this.zodiacOptions = this.rawZodiacs.map((z: any) => z.zodiacTamil);
                this.patchDependentFields();
            },
            error: (err: any) => console.error('Error loading zodiac list', err)
        });
        this.signupService.getStars().subscribe({
            next: (res: any) => {
                this.rawStars = res || [];
                this.starOptions = this.rawStars.map((s: any) => s.starTamil);
                this.patchDependentFields();
            },
            error: (err) => console.error('Error loading star list', err)
        });
        this.signupService.getHeights().subscribe({
            next: (res: any) => {
                this.rawHeights = res || [];
                this.heightOptions = this.rawHeights.map((h: any) => h.heightName);
                this.patchDependentFields();
            },
            error: (err) => console.error('Error loading height list', err)
        });
        this.signupService.getWeights().subscribe({
            next: (res: any) => {
                this.rawWeights = res || [];
                this.weightOptions = this.rawWeights.map((w: any) => w.weightName);
                this.patchDependentFields();
            },
            error: (err) => console.error('Error loading weight list', err)
        });
    }

    loadProfileDetails(id: number) {
        this.signupService.getProfileDetails(id).subscribe({
            next: (res) => {
                this.profile = res.result;

                // Append cache busters to image URLs to prevent rendering stale cached files
                const timestamp = Date.now();
                if (this.profile && this.profile.profileImages && this.profile.profileImages.length > 0) {
                    this.profile.profileImages.forEach((img: any) => {
                        if (img.profileUrl) {
                            img.profileUrl = img.profileUrl.split('?')[0] + `?t=${timestamp}`;
                        }
                    });
                }
                if (this.profile && this.profile.zodiacDetails && this.profile.zodiacDetails.length > 0) {
                    this.profile.zodiacDetails.forEach((z: any) => {
                        if (z.jathgamImage) {
                            z.jathgamImage = z.jathgamImage.split('?')[0] + `?t=${timestamp}`;
                        }
                    });
                }

                this.isOwnProfile = this.isLoggedIn &&
                    this.authService.currentUser()?.id === this.profile.id;
                console.log("isOwnProfile", this.isOwnProfile, "selectedImageFile", this.selectedImageFile);
                this.patchForms();
                this.patchDependentFields();
            },
            error: (err) => {
                console.error(err);
                alert('Failed to load profile details. Please try again.');
            }
        });
    }

    // Master lists and the profile can arrive in either order. Once both are
    // present, re-patch the id-backed selects (district/zodiac/star/height/weight)
    // so they show the correct label instead of being left blank.
    private patchDependentFields() {
        if (!this.profile) return;
        this.basicForm.patchValue({ district: this.profile.districtId }, { emitEvent: false });

        const zodiacId = this.zodiacDetail.zodiac?.id ?? this.zodiacDetail.zodiacId;
        const starId = this.zodiacDetail.star?.id ?? this.zodiacDetail.starId;
        if (zodiacId) this.zodiacForm.patchValue({ zodiacId: zodiacId }, { emitEvent: false });
        if (starId) this.zodiacForm.patchValue({ starId: starId }, { emitEvent: false });

        const heightName = this.rawHeights.find(
            h => h.id === (this.personal.height?.id ?? this.personal.heightId)
        )?.heightName;
        if (heightName) this.personalForm.patchValue({ height: heightName }, { emitEvent: false });

        const weightName = this.rawWeights.find(
            w => w.id === (this.personal.weight?.id ?? this.personal.weightId)
        )?.weightName;
        if (weightName) this.personalForm.patchValue({ weight: weightName }, { emitEvent: false });
    }

    patchForms() {
        const personal = this.personal;
        const career = this.career;
        const parent = this.parent;
        const zodiac = this.zodiacDetail;

        this.basicForm.patchValue({
            name: this.profile.name,
            // ASSUMPTION: API returns 'MALE'/'FEMALE' as registration sends them
            gender: this.profile.gender === 'MALE' ? 'Male'
                : this.profile.gender === 'FEMALE' ? 'Female' : '',
            religion: this.religionOptions.find(
                (r: string) => r.toUpperCase() === this.profile.religion
            ) || this.profile.religion || '',
            maritalStatus: Object.keys(this.maritalStatusMap)
                .find(k => this.maritalStatusMap[k] === this.profile.martialStatus) || '',
            nativePlace: this.profile.nativePlace || '',
            district: this.profile.districtId || ''
        });

        this.personalForm.patchValue({
            height: personal.height?.heightName || '',
            weight: personal.weight?.heightName || personal.weight?.weightName || '',
            skinTone: personal.skinTone || '',
            foodOption: personal.foodOption === 'VEG' ? 'சைவம்' :
                personal.foodOption === 'NONVEG' ? 'அசைவம்' : 'எப்போதாவது அசைவம்',
            asset: personal.asset || '',
            Interest: personal.Interest || ''
        });

        this.careerForm.patchValue({
            profession: career.profession || '',
            companyName: career.companyName || '',
            workLocation: career.workLocation || '',
            monthyIncome: career.monthyIncome || '',
            educationDetails: Array.isArray(career.educationDetails)
                ? career.educationDetails.join(', ')
                : (career.educationDetails || '')
        });

        this.familyForm.patchValue({
            fatherName: parent.fatherName || '',
            fatherMobileNumber: parent.fatherMobileNumber || '',
            motherName: parent.motherName || '',
            motherMobileNumber: parent.motherMobileNumber || '',
            siblingMale: parent.siblingMale || 0,
            siblingFemale: parent.siblingFemale || 0,
            marriedMale: parent.marriedMale || 0,
            marriedFemale: parent.marriedFemale || 0
        });

        this.zodiacForm.patchValue({
            zodiacId: zodiac.zodiac?.id || '',
            starId: zodiac.star?.id || '',
            patham: zodiac.patham ? `${zodiac.patham}` : '',
            dosham: zodiac.dosham || ''
        });
    }

    // ---- Same id-lookup helpers as registration ----
    private getDistrictId(name: string): number | null {
        return this.rawDistricts.find(d => d.districtName === name)?.id ?? null;
    }
    private getZodiacId(name: string): number | null {
        return this.rawZodiacs.find(z => z.zodiacTamil === name)?.id ?? null;
    }
    private getStarId(name: string): number | null {
        return this.rawStars.find(s => s.starTamil === name)?.id ?? null;
    }
    private getHeightId(name: string): number | null {
        return this.rawHeights.find(h => h.heightName === name)?.id ?? null;
    }
    private getWeightId(name: string): number | null {
        return this.rawWeights.find(w => w.weightName === name)?.id ?? null;
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
            basic: () => this.signupService.updateProfileDetails(id, {
                name: this.basicForm.value.name,
                gender: this.basicForm.value.gender === 'Male' ? 'MALE' : 'FEMALE',
                religion: this.basicForm.value.religion?.toUpperCase(),
                martialStatus: this.maritalStatusMap[this.basicForm.value.maritalStatus || ''] || 'SEPARATED_WITH_CHILDREN',
                nativePlace: this.basicForm.value.nativePlace,
                districtId: this.basicForm.value.district
            }),
            personal: () => this.signupService.updateProfilePersonal(id, {
                heightId: this.getHeightId(this.personalForm.value.height || ''),
                weightId: this.getWeightId(this.personalForm.value.weight || ''),
                skinTone: this.personalForm.value.skinTone,
                foodOption: this.personalForm.value.foodOption === 'சைவம்' ? 'VEG' :
                    this.personalForm.value.foodOption === 'அசைவம்' ? 'NONVEG' : 'SOMETIMES_NONVEG',
                asset: this.personalForm.value.asset,
                interest: this.personalForm.value.Interest
            }),
            career: () => this.signupService.updateProfileCareer(id, {
                profession: this.careerForm.value.profession,
                companyName: this.careerForm.value.companyName,
                workLocation: this.careerForm.value.workLocation,
                monthyIncome: this.careerForm.value.monthyIncome ? Number(this.careerForm.value.monthyIncome) : 0,
                educationDetails: (this.careerForm.value.educationDetails as string)
                    ?.split(',').map(s => s.trim()).filter(Boolean)
            }),
            family: () => this.signupService.updateProfileFamily(id, this.familyForm.value),
            zodiac: () => this.signupService.updateProfileZodiac(id, {
                zodiacId: this.zodiacForm.value.zodiacId || '',
                starId: this.zodiacForm.value.starId || '',
                patham: this.zodiacForm.value.patham?.match(/\d+/)?.[0] || '1',
                dosham: this.zodiacForm.value.dosham
            }),
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
    onImageSelected(event: Event, isProfileImage: boolean) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            if (isProfileImage) {
                this.selectedImageFile = file;
                reader.onload = () => this.imagePreviewUrl = reader.result as string;
            } else {
                this.selectedJathagamFile = file;
                reader.onload = () => this.jathagamPreviewUrl = reader.result as string;
            }
            reader.readAsDataURL(file);
        }
    }

    cancelImageEdit(isProfileImage: boolean) {
        if (isProfileImage) {
            this.selectedImageFile = null;
            this.imagePreviewUrl = null;
        } else {
            this.selectedJathagamFile = null;
            this.jathagamPreviewUrl = null;
        }
    }

    uploadImage(isProfileImage: boolean) {
        const file = isProfileImage ? this.selectedImageFile : this.selectedJathagamFile;
        if (!file || !this.profile) return;

        if (isProfileImage) {
            this.uploadingImage = true;
        } else {
            this.uploadingJathagam = true;
        }

        const extension = file.name.split('.').pop() || 'jpg';
        const uniqueFileName = `${this.profile.matrimonyId}_${Date.now()}.${extension}`;

        this.signupService.getSignedUrl(isProfileImage ? 'profile/profileimage' : 'profile/jathagamimage', uniqueFileName, file.type).subscribe({
            next: (res: any) => {
                const { signedUrl, publicUrl } = res.result;
                fetch(signedUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type, 'Cache-Control': 'no-cache, must-revalidate' }
                }).then(() => {
                    this.signupService.updateProfileImage(this.profile.id, isProfileImage ? { profileUrl: publicUrl } : { jathagamImage: publicUrl }, isProfileImage).subscribe({
                        next: () => {
                            if (isProfileImage) {
                                this.uploadingImage = false;
                            } else {
                                this.uploadingJathagam = false;
                            }
                            this.cancelImageEdit(isProfileImage);
                            this.loadProfileDetails(this.profile.id);
                        },
                        error: (err: any) => {
                            this.uploadingImage = false;
                            this.uploadingJathagam = false;
                            console.error(err);
                            alert('Failed to save image. Please try again.');
                        }
                    });
                }).catch((err) => {
                    this.uploadingImage = false;
                    this.uploadingJathagam = false;
                    console.error(err);
                    alert('Upload failed. Please try again.');
                });
            },
            error: (err: any) => {
                this.uploadingImage = false;
                this.uploadingJathagam = false;
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