import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { Router } from '@angular/router';
import { SignupService } from '../signup.service';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatStepperModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MatRadioModule
    ],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
    private _fb = inject(FormBuilder);
    private signupService = inject(SignupService);
    private router = inject(Router);

    @ViewChild('stepper') stepper!: MatStepper;

    isLoading = false;

    // Master Data
    districts: any[] = [];
    zodiacs: any[] = [];
    stars: any[] = [];
    heights: any[] = [];
    weights: any[] = [];

    // --- Step 1: Basic Profile ---
    basicForm = this._fb.group({
        name: ['', Validators.required],
        gender: ['FEMALE', Validators.required],
        dob: ['', Validators.required],
        mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
        password: ['', Validators.required],
        martialStatus: ['UNMARRIED', Validators.required],
        religion: ['HINDU', Validators.required],
        nativePlace: ['', Validators.required],
        districtId: ['', Validators.required]
    });

    // --- Step 2: Career ---
    careerForm = this._fb.group({
        educationDetails: ['', Validators.required], // Will convert to array
        profession: ['', Validators.required],
        companyName: [''],
        monthyIncome: ['', Validators.required],
        workLocation: ['', Validators.required]
    });

    // --- Step 3: Family ---
    familyForm = this._fb.group({
        fatherName: ['', Validators.required],
        motherName: ['', Validators.required],
        fatherMobileNumber: [''],
        motherMobileNumber: ['']
    });

    // --- Step 4: Zodiac ---
    zodiacForm = this._fb.group({
        zodiacId: ['', Validators.required],
        starId: ['', Validators.required],
        patham: [''],
        jathagamImage: [''] // URL or File placeholder
    });

    // --- Step 5: Personal ---
    personalForm = this._fb.group({
        heightId: ['', Validators.required],
        weightId: ['', Validators.required],
        skinTone: [''],
        Interest: [''],
        asset: ['']
    });

    // --- Step 6: Profile Image ---
    imageForm = this._fb.group({
        profileUrl: ['', Validators.required]
    });

    ngOnInit() {
        this.loadMasterData();
    }

    loadMasterData() {
        this.signupService.getDistricts().subscribe(data => this.districts = data);
        this.signupService.getZodiacs().subscribe(data => this.zodiacs = data);
        this.signupService.getStars().subscribe(data => this.stars = data);
        this.signupService.getHeights().subscribe(data => this.heights = data);
        this.signupService.getWeights().subscribe(data => this.weights = data);
    }

    // Submit Step 1
    saveProfile() {
        if (this.basicForm.valid) {
            this.isLoading = true;
            const payload = {
                ...this.basicForm.value,
                dob: this.formatDate(this.basicForm.value.dob)
                // ensure districtId is number if needed, though reactive forms usually keep types if set correctly
            };

            this.signupService.createProfile(payload).subscribe({
                next: (res) => {
                    this.isLoading = false;
                    // ID is set in service
                    this.stepper.next();
                },
                error: (err) => {
                    this.isLoading = false;
                    alert('Failed to save profile: ' + JSON.stringify(err));
                }
            });
        }
    }

    // Submit Step 2
    saveCareer() {
        if (this.careerForm.valid) {
            this.isLoading = true;
            const formVal = this.careerForm.value;
            const payload = {
                ...formVal,
                educationDetails: [formVal.educationDetails] // Convert string to Array based on API requirement
            };

            this.signupService.saveCareer(payload).subscribe({
                next: () => { this.isLoading = false; this.stepper.next(); },
                error: (err) => { this.isLoading = false; alert('Error: ' + JSON.stringify(err)); }
            });
        }
    }

    // Submit Step 3
    saveFamily() {
        if (this.familyForm.valid) {
            this.isLoading = true;
            this.signupService.saveFamily(this.familyForm.value).subscribe({
                next: () => { this.isLoading = false; this.stepper.next(); },
                error: (err) => { this.isLoading = false; alert('Error: ' + JSON.stringify(err)); }
            });
        }
    }

    // Submit Step 4
    saveZodiac() {
        if (this.zodiacForm.valid) {
            this.isLoading = true;
            this.signupService.saveZodiac(this.zodiacForm.value).subscribe({
                next: () => { this.isLoading = false; this.stepper.next(); },
                error: (err) => { this.isLoading = false; alert('Error: ' + JSON.stringify(err)); }
            });
        }
    }

    // Submit Step 5
    savePersonal() {
        if (this.personalForm.valid) {
            this.isLoading = true;
            this.signupService.savePersonal(this.personalForm.value).subscribe({
                next: () => { this.isLoading = false; this.stepper.next(); },
                error: (err) => { this.isLoading = false; alert('Error: ' + JSON.stringify(err)); }
            });
        }
    }

    // Submit Step 6
    saveImage() {
        // For now, assuming user pastes a URL or we send a dummy one, 
        // as no upload API was provided in the standard flow.
        if (this.imageForm.valid) {
            this.isLoading = true;
            this.signupService.saveProfileImage(this.imageForm.value).subscribe({
                next: () => {
                    this.isLoading = false;
                    alert('Registration Completed Successfully!');
                    this.router.navigate(['/login']);
                },
                error: (err) => { this.isLoading = false; alert('Error: ' + JSON.stringify(err)); }
            });
        }
    }

    // Helper to format Date to YYYY-MM-DD
    private formatDate(dateVal: any): string {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        return d.toISOString().split('T')[0];
    }
}
