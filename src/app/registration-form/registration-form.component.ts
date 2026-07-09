import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SignupService } from '../signup.service';

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

    ngOnInit() {
        this.loadDynamicOptions();
    }

    loadDynamicOptions() {
        this._signupService.getDistricts().subscribe({
            next: (data) => {
                if (data && data.length) {
                    this.districtOptions = data.map(d => d.districtName);
                }
            },
            error: (err) => console.error('Error loading districts:', err)
        });
        this._signupService.getZodiacs().subscribe({
            next: (data) => {
                if (data && data.length) {
                    this.zodiacOptions = data.map(z => z.zodiacTamil);
                }
            },
            error: (err) => console.error('Error loading zodiacs:', err)
        });
        this._signupService.getStars().subscribe({
            next: (data) => {
                if (data && data.length) {
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
                    this.heightOptions = data.map(h => h.heightName);
                }
            },
            error: (err) => console.error('Error loading heights:', err)
        });
        this._signupService.getWeights().subscribe({
            next: (data) => {
                if (data && data.length) {
                    this.weightOptions = data.map(w => w.weightName);
                }
            },
            error: (err) => console.error('Error loading weights:', err)
        });
    }


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
        fatherName: ['', Validators.required],
        motherName: ['', Validators.required]
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
            // Logic for preview if needed, or just show file name
            this.jathamPreviewUrl = file.name;
        }
    }

    isLinear = true;

    onSubmit() {
        if (this.basicDetailsForm.valid && this.educationForm.valid && this.horoscopeDetailsForm.valid &&
            this.personalContactForm.valid && this.physicalDetailsForm.valid && this.profilePhotoForm.valid) {
            this.isSubmitting = true;

            const basic = this.basicDetailsForm.value;
            const edu = this.educationForm.value;
            const horo = this.horoscopeDetailsForm.value;
            const contact = this.personalContactForm.value;
            const physical = this.physicalDetailsForm.value;

            // Format Date to DD-MM-YYYY
            let formattedDob = '';
            if (basic.dob) {
                const d = new Date(basic.dob);
                const day = ('0' + d.getDate()).slice(-2);
                const month = ('0' + (d.getMonth() + 1)).slice(-2);
                const year = d.getFullYear();
                formattedDob = `${day}-${month}-${year}`;
            }

            // Construct Payload matching JotForm structure
            const payload = {
                // Basic
                q36_gender: basic.gender,
                q64_name: basic.name,
                q25_date: formattedDob,
                q72_mobileNumber72: basic.mobileNumber, // Assuming backend handles string
                q34_martialStatus: basic.maritalStatus,
                q78_religion: basic.religion,
                q28_typeA: basic.nativePlace, // Native Place
                q65_district: basic.district,
                q45_fathersName: basic.fatherName,
                q31_mothersName: basic.motherName,

                // Education
                q38_education: edu.education,
                q39_profession: edu.profession,
                q40_company: edu.company,
                q41_monthlyIncome: edu.monthlyIncome,
                q42_workLocation: edu.workLocation,

                // Horoscope
                q47_zodiacnbsp: horo.zodiac,
                q48_starnbsp: horo.star,
                q49_input49: horo.paatham,
                q50_dosham: horo.dosham,
                // Matching star missing in backend code? 

                // Contact
                q53_typeA53: contact.contactPersonName,
                q54_typeA54: contact.contactType,
                q55_mobileNumber: contact.mobileNumber,
                q56_input56: contact.propertyValue, // Asset
                q57_input57: contact.expectation,   // Interest/Expectation

                // Physical
                q73_height: physical.height,
                q74_weight: physical.weight,
                q60_color: physical.color,
                q61_foodOption: physical.foodOption
            };

            console.log('Form Payload:', payload);

            // Handle Files separately or append to FormData if submitting via API
            const formData = new FormData();
            formData.append('rawRequest', JSON.stringify(payload));

            const photoFile = this.profilePhotoForm.get('photo')?.value;
            if (photoFile) {
                formData.append('photo', photoFile);
            }

            const jathamFile = this.horoscopeDetailsForm.get('jathamImage')?.value;
            if (jathamFile) {
                formData.append('jathamImage', jathamFile);
            }

            // API Call
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

        } else {
            console.log('Form Invalid');
            this.basicDetailsForm.markAllAsTouched();
        }
    }
}
