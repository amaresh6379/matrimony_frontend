import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { SignupService } from '../signup.service';
import { lastValueFrom } from 'rxjs';

import {
    MARITAL_STATUS, RELIGION, DISTRICTS, ZODIAC, STAR, PAATHAM, DOSHAM, CONTACT_TYPE, PROPERTY_VALUE,
    HEIGHTS, WEIGHTS, COLORS, FOOD_OPTIONS
} from './form-data';

@Component({
    selector: 'app-registration-form',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatStepperModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatRadioModule,
        MatCheckboxModule,
        MatIconModule,
        MatCardModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    templateUrl: './registration-form.component.html',
    styleUrl: './registration-form.component.scss'
})
export class RegistrationFormComponent implements OnInit {
    private _formBuilder = inject(FormBuilder);
    private _http = inject(HttpClient);
    private _signupService = inject(SignupService);
    private _route = inject(ActivatedRoute);
    private _router = inject(Router);

    @ViewChild('stepper') stepper!: MatStepper;

    // Mode configuration
    isSignupMode = false;

    // Data Constants
    maritalStatusOptions = MARITAL_STATUS;
    religionOptions = RELIGION;
    districtOptions = DISTRICTS;
    zodiacOptions = ZODIAC;
    starOptions = STAR;
    paathamOptions = PAATHAM;
    doshamOptions = DOSHAM;
    matchingStarOptions = STAR;
    contactTypeOptions = CONTACT_TYPE;
    propertyValueOptions = PROPERTY_VALUE;
    heightOptions = HEIGHTS;
    weightOptions = WEIGHTS;
    colorOptions = COLORS;
    foodOptions = FOOD_OPTIONS;

    // Raw dynamic master lists to get IDs in signup mode
    rawDistricts: any[] = [];
    rawZodiacs: any[] = [];
    rawStars: any[] = [];
    rawHeights: any[] = [];
    rawWeights: any[] = [];

    // PAGE 1: Basic Details
    basicDetailsForm = this._formBuilder.group({
        gender: ['Male', Validators.required],
        name: ['', Validators.required],
        dob: ['', Validators.required],
        maritalStatus: ['', Validators.required],
        religion: ['', Validators.required],
        nativePlace: ['', Validators.required], // Native Place
        district: ['', Validators.required],
        mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
        password: [''],
        fatherName: ['', Validators.required],
        fatherMobileNumber: [''],
        motherName: ['', Validators.required],
        motherMobileNumber: ['']
    });

    // PAGE 2: Education & Profession
    educationForm = this._formBuilder.group({
        education: ['', Validators.required],
        profession: ['', Validators.required],
        company: [''],
        monthlyIncome: [''],
        workLocation: ['']
    });

    // PAGE 3: Horoscope Details
    horoscopeDetailsForm = this._formBuilder.group({
        zodiac: ['', Validators.required],
        star: ['', Validators.required],
        paatham: ['', Validators.required],
        dosham: ['', Validators.required],
        jathamImage: [null as File | null], // Optional image
        matchingStar: [[] as string[]]
    });

    // PAGE 4: Contact & Personal
    personalContactForm = this._formBuilder.group({
        contactPersonName: ['', Validators.required],
        contactType: ['', Validators.required],
        mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
        propertyValue: ['', Validators.required], // solthu mathippu
        expectation: [''] // viruppam
    });

    // PAGE 5: Physical Details
    physicalDetailsForm = this._formBuilder.group({
        height: [''],
        weight: [''],
        color: [''],
        foodOption: ['']
    });

    // PAGE 6: Profile Photo
    profilePhotoForm = this._formBuilder.group({
        photo: [null as File | null, Validators.required]
    });

    // Image Previews
    profilePreviewUrl: string | ArrayBuffer | null = 'https://dummyimage.com/150x150/cccccc/757575.png&text=Upload+Photo';
    jathamPreviewUrl: string | ArrayBuffer | null = null;

    isSubmitting = false;
    isLinear = true;

    ngOnInit() {
        this._route.data.subscribe(data => {
            this.isSignupMode = !!data['isSignupMode'];

            const passwordControl = this.basicDetailsForm.get('password');
            if (this.isSignupMode) {
                passwordControl?.setValidators(Validators.required);

                // Clear photo required validator
                this.profilePhotoForm.get('photo')?.clearValidators();
                this.profilePhotoForm.get('photo')?.updateValueAndValidity();
            } else {
                passwordControl?.clearValidators();
            }
            passwordControl?.updateValueAndValidity();
        });
        this.loadDynamicOptions();
    }

    loadDynamicOptions() {
        this._signupService.getDistricts().subscribe({
            next: (data) => {
                if (data && data.length) {
                    this.rawDistricts = data;
                    this.districtOptions = data.map(d => d.districtName);
                }
            },
            error: (err) => console.error('Error loading districts:', err)
        });
        this._signupService.getZodiacs().subscribe({
            next: (data) => {
                if (data && data.length) {
                    this.rawZodiacs = data;
                    this.zodiacOptions = data.map(z => z.zodiacTamil);
                }
            },
            error: (err) => console.error('Error loading zodiacs:', err)
        });
        this._signupService.getStars().subscribe({
            next: (data) => {
                if (data && data.length) {
                    this.rawStars = data;
                    const mapped = data.map(s => s.starTamil);
                    this.starOptions = mapped;
                    this.matchingStarOptions = mapped;
                }
            },
            error: (err) => console.error('Error loading stars:', err)
        });
        this._signupService.getHeights().subscribe({
            next: (data) => {
                if (data && data.length) {
                    this.rawHeights = data;
                    this.heightOptions = data.map(h => h.heightName);
                }
            },
            error: (err) => console.error('Error loading heights:', err)
        });
        this._signupService.getWeights().subscribe({
            next: (data) => {
                if (data && data.length) {
                    this.rawWeights = data;
                    this.weightOptions = data.map(w => w.weightName);
                }
            },
            error: (err) => console.error('Error loading weights:', err)
        });
    }

    onProfilePhotoSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.profilePhotoForm.patchValue({ photo: file });
            this.profilePhotoForm.get('photo')?.updateValueAndValidity();
            const reader = new FileReader();
            reader.onload = () => this.profilePreviewUrl = reader.result;
            reader.readAsDataURL(file);
        }
    }

    onJathamImageSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.horoscopeDetailsForm.patchValue({ jathamImage: file });
            this.jathamPreviewUrl = file.name;
        }
    }

    // Helper to format Date to YYYY-MM-DD
    private formatDate(dateVal: any): string {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        return d.toISOString().split('T')[0];
    }

    // Master mappings helper
    private getDistrictId(name: string): number | null {
        const found = this.rawDistricts.find(d => d.districtName === name);
        return found ? found.id : null;
    }

    private getZodiacId(name: string): number | null {
        const found = this.rawZodiacs.find(z => z.zodiacTamil === name);
        return found ? found.id : null;
    }

    private getStarId(name: string): number | null {
        const found = this.rawStars.find(s => s.starTamil === name);
        return found ? found.id : null;
    }

    private getHeightId(name: string): number | null {
        const found = this.rawHeights.find(h => h.heightName === name);
        return found ? found.id : null;
    }

    private getWeightId(name: string): number | null {
        const found = this.rawWeights.find(w => w.weightName === name);
        return found ? found.id : null;
    }

    private async uploadFile(file: File, folder: string, customFileName?: string): Promise<string> {
        const extension = file.name.split('.').pop() || 'jpg';
        const fileName = customFileName ? `${customFileName}.${extension}` : `temp-${Date.now()}.${extension}`;

        try {
            const res = await lastValueFrom(this._signupService.getSignedUrl(folder, fileName, file.type));
            const signedUrl = res?.result?.signedUrl;
            const publicUrl = res?.result?.publicUrl;

            if (!signedUrl || !publicUrl) {
                throw new Error('Failed to retrieve signed URL');
            }

            await lastValueFrom(this._signupService.uploadFileToS3(signedUrl, file));
            return publicUrl;
        } catch (err: any) {
            console.error('File upload error: ', err);
            throw err;
        }
    }

    async goToNextStep(currentStep: number) {
        if (!this.isSignupMode) {
            this.stepper.next();
            return;
        }

        this.isSubmitting = true;

        if (currentStep === 1) {
            const basic = this.basicDetailsForm.value as any;
            const payload = {
                name: basic.name,
                gender: basic.gender === 'Male' ? 'MALE' : 'FEMALE',
                dob: this.formatDate(basic.dob),
                mobileNumber: basic.mobileNumber,
                password: basic.password,
                martialStatus: basic.maritalStatus === 'Unmarried' ? 'UNMARRIED' :
                    basic.maritalStatus === 'Divorced' ? 'DIVORCED' :
                        basic.maritalStatus === 'Divorced with Children' ? 'DIVORCED_WITH_CHILDREN' :
                            basic.maritalStatus === 'Widow/Widower' ? 'WIDOW/WIDOWER' :
                                basic.maritalStatus === 'Widow/Widower with Children' ? 'WIDOW/WIDOWER_WITH_CHILDREN' :
                                    basic.maritalStatus === 'Separated' ? 'SEPARATED' : 'SEPARATED_WITH_CHILDREN',
                religion: basic.religion?.toUpperCase(),
                nativePlace: basic.nativePlace,
                districtId: this.getDistrictId(basic.district)
            };

            this._signupService.createProfile(payload).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.stepper.next();
                },
                error: (err) => {
                    this.isSubmitting = false;
                    alert('Error saving basic details: ' + (err.error?.message || err.message || JSON.stringify(err)));
                }
            });
        }
        else if (currentStep === 2) {
            const edu = this.educationForm.value;
            const payload = {
                educationDetails: [edu.education],
                profession: edu.profession,
                companyName: edu.company || '',
                monthyIncome: edu.monthlyIncome ? Number(edu.monthlyIncome) : 0,
                workLocation: edu.workLocation || ''
            };

            this._signupService.saveCareer(payload).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.stepper.next();
                },
                error: (err) => {
                    this.isSubmitting = false;
                    alert('Error saving career details: ' + (err.error?.message || err.message || JSON.stringify(err)));
                }
            });
        }
        else if (currentStep === 3) {
            const horo = this.horoscopeDetailsForm.value;
            const file = horo.jathamImage as any;
            this.isSubmitting = true;

            const payload: any = {
                zodiacId: this.getZodiacId(horo.zodiac || ''),
                starId: this.getStarId(horo.star || ''),
                patham: horo.paatham?.match(/\d+/)?.[0] || '1',
                dosham: horo.dosham || 'சுத்த ஜாதகம்'
            };

            try {
                if (file) {
                    const matrimonyId = this._signupService.currentMatrimonyId();
                    if (!matrimonyId) {
                        throw new Error('Matrimony ID not set from Step 1');
                    }
                    payload.jathgamImage = await this.uploadFile(file, 'profile/jathagamimage', matrimonyId);
                }

                this._signupService.saveZodiac(payload).subscribe({
                    next: () => {
                        this.isSubmitting = false;
                        this.stepper.next();
                    },
                    error: (err) => {
                        this.isSubmitting = false;
                        alert('Error saving zodiac details: ' + (err.error?.message || err.message || JSON.stringify(err)));
                    }
                });
            } catch (err: any) {
                this.isSubmitting = false;
                alert('Error uploading zodiac image: ' + (err.message || JSON.stringify(err)));
            }
        }
        else if (currentStep === 4) {
            const contact = this.personalContactForm.value;
            const basic = this.basicDetailsForm.value as any;
            const payload = {
                fatherName: basic.fatherName,
                motherName: basic.motherName,
                fatherMobileNumber: basic.fatherMobileNumber || '',
                motherMobileNumber: basic.motherMobileNumber || '',
                contactPersonName: contact.contactPersonName,
                contactPersonNumber: contact.mobileNumber,
                contactPersonType: contact.contactType
            };

            this._signupService.saveFamily(payload).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.stepper.next();
                },
                error: (err) => {
                    this.isSubmitting = false;
                    alert('Error saving family details: ' + (err.error?.message || err.message || JSON.stringify(err)));
                }
            });
        }
        else if (currentStep === 5) {
            const physical = this.physicalDetailsForm.value;
            const contact = this.personalContactForm.value;

            const rawFood = physical.foodOption;
            const foodOption = rawFood === 'சைவம்' ? 'VEG' :
                rawFood === 'அசைவம்' ? 'NONVEG' : 'SOMETIMES_NONVEG';

            const payload = {
                heightId: this.getHeightId(physical.height || ''),
                weightId: this.getWeightId(physical.weight || ''),
                skinTone: physical.color || '',
                foodOption: foodOption,
                Interest: contact.expectation || '',
                asset: contact.propertyValue || ''
            };

            this._signupService.savePersonal(payload).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.stepper.next();
                },
                error: (err) => {
                    this.isSubmitting = false;
                    alert('Error saving personal details: ' + (err.error?.message || err.message || JSON.stringify(err)));
                }
            });
        }
    }

    async onSubmit() {
        if (this.isSignupMode) {
            this.isSubmitting = true;
            const file = this.profilePhotoForm.get('photo')?.value as any;
            try {
                let uploadedUrl = 'https://dummyimage.com/300x300/cccccc/757575.png';
                if (file) {
                    const matrimonyId = this._signupService.currentMatrimonyId();
                    if (!matrimonyId) {
                        throw new Error('Matrimony ID not set from Step 1');
                    }
                    uploadedUrl = await this.uploadFile(file, 'profile/profileimage', matrimonyId);
                }

                const payload = {
                    profileUrl: uploadedUrl
                };
                this._signupService.saveProfileImage(payload).subscribe({
                    next: () => {
                        this.isSubmitting = false;
                        alert('Registration Completed Successfully!');
                        this._router.navigate(['/login']);
                    },
                    error: (err) => {
                        this.isSubmitting = false;
                        alert('Submission Failed: ' + (err.error?.message || err.message || JSON.stringify(err)));
                    }
                });
            } catch (err: any) {
                this.isSubmitting = false;
                alert('Error uploading profile photo: ' + (err.message || JSON.stringify(err)));
            }
            return;
        }

        if (this.basicDetailsForm.valid && this.educationForm.valid && this.horoscopeDetailsForm.valid &&
            this.personalContactForm.valid && this.physicalDetailsForm.valid && this.profilePhotoForm.valid) {
            this.isSubmitting = true;

            const basic = this.basicDetailsForm.value;
            const edu = this.educationForm.value;
            const horo = this.horoscopeDetailsForm.value;
            const contact = this.personalContactForm.value;
            const physical = this.physicalDetailsForm.value;

            let formattedDob = '';
            if (basic.dob) {
                const d = new Date(basic.dob);
                const day = ('0' + d.getDate()).slice(-2);
                const month = ('0' + (d.getMonth() + 1)).slice(-2);
                const year = d.getFullYear();
                formattedDob = `${day}-${month}-${year}`;
            }

            try {
                let photoUrl: string | null = null;
                const photoFile = this.profilePhotoForm.get('photo')?.value as any;
                if (photoFile) {
                    photoUrl = await this.uploadFile(photoFile, 'profile/profileimage');
                }

                let jathamUrl: string | null = null;
                const jathamFile = this.horoscopeDetailsForm.get('jathamImage')?.value as any;
                if (jathamFile) {
                    jathamUrl = await this.uploadFile(jathamFile, 'profile/jathagamimage');
                }

                const payload: any = {
                    q36_gender: basic.gender,
                    q64_name: basic.name,
                    q25_date: formattedDob,
                    q72_mobileNumber72: basic.mobileNumber,
                    q34_martialStatus: basic.maritalStatus,
                    q78_religion: basic.religion,
                    q28_typeA: basic.nativePlace,
                    q65_district: basic.district,
                    q45_fathersName: basic.fatherName,
                    q31_mothersName: basic.motherName,

                    q38_education: edu.education,
                    q39_profession: edu.profession,
                    q40_company: edu.company,
                    q41_monthlyIncome: edu.monthlyIncome,
                    q42_workLocation: edu.workLocation,

                    q47_zodiacnbsp: horo.zodiac,
                    q48_starnbsp: horo.star,
                    q49_input49: horo.paatham,
                    q50_dosham: horo.dosham,

                    q53_typeA53: contact.contactPersonName,
                    q54_typeA54: contact.contactType,
                    q55_mobileNumber: contact.mobileNumber,
                    q56_input56: contact.propertyValue,
                    q57_input57: contact.expectation,

                    q73_height: physical.height,
                    q74_weight: physical.weight,
                    q60_color: physical.color,
                    q61_foodOption: physical.foodOption
                };

                if (photoUrl) {
                    payload.photo = [photoUrl];
                }
                if (jathamUrl) {
                    payload.jathamImage = [jathamUrl];
                }

                const formData = new FormData();
                formData.append('rawRequest', JSON.stringify(payload));

                this._http.post(`${environment.apiUrl}/profile/form`, formData).subscribe({
                    next: (res) => {
                        console.log('Success:', res);
                        alert('Registration Submitted Successfully!');
                        this.isSubmitting = false;
                    },
                    error: (err) => {
                        console.error('Error:', err);
                        alert('Submission Failed. Please try again.');
                        this.isSubmitting = false;
                    }
                });
            } catch (err: any) {
                this.isSubmitting = false;
                alert('Upload failed: ' + (err.message || JSON.stringify(err)));
            }
        } else {
            console.log('Form Invalid');
            this.basicDetailsForm.markAllAsTouched();
        }
    }
}
