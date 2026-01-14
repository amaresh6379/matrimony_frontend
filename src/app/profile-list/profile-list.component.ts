import { Component, ViewChild, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar'; // For completion %
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

interface Profile {
    id: string;
    name: string;
    age: number;
    image: string;
    zodiac: string;
    star: string;
    native: string;
    education: string;
    profession: string;
    location: string;
    salary: string;
    maritalStatus: string;
    dosham: string;
    interestSent?: boolean; // Track local state for UI
}

@Component({
    selector: 'app-profile-list',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatPaginatorModule,
        MatExpansionModule,
        MatInputModule,
        MatFormFieldModule,
        MatProgressBarModule
    ],
    templateUrl: './profile-list.component.html',
    styleUrl: './profile-list.component.scss'
})
export class ProfileListComponent implements OnInit, AfterViewInit {
    private _fb = inject(FormBuilder);
    private router = inject(Router);
    private authService = inject(AuthService);

    get isLoggedIn() {
        return this.authService.isLoggedIn();
    }

    userProfileCompletion = 75; // Mock percentage for logged in user

    // Pagination
    totalProfiles = 0;
    pageSize = 10;
    pageIndex = 0;
    visibleProfiles: Profile[] = [];
    allProfiles: Profile[] = [];

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    // Filters
    filterForm = this._fb.group({
        searchQuery: [''],
        ageFrom: [''],
        ageTo: [''],
        location: ['']
    });

    ngOnInit() {
        this.generateMockProfiles();
        this.updateVisibleProfiles();

        this.filterForm.valueChanges.subscribe(() => {
            this.pageIndex = 0;
            if (this.paginator) this.paginator.firstPage();
            this.updateVisibleProfiles();
        });
    }

    ngAfterViewInit() { }

    generateMockProfiles() {
        const baseProfiles: Profile[] = [
            {
                id: 'MM24618', name: 'Keerthika', age: 24, image: 'https://dummyimage.com/300x300/e91e63/ffffff&text=Keerthika',
                zodiac: 'Rishabam', star: 'Mrigasheersham', native: 'Trichy',
                education: 'BE CSE', profession: 'Software Engineer', location: 'Coimbatore', salary: '45,000',
                maritalStatus: 'Unmarried', dosham: 'Suddha Jathagam'
            },
            {
                id: 'MM24617', name: 'S Sangaranarayanan', age: 40, image: 'https://dummyimage.com/300x300/3f51b5/ffffff&text=Sangaranarayanan',
                zodiac: 'Viruchiga', star: 'Kettai', native: 'Srivilliputhur',
                education: 'Diploma', profession: 'Own Business', location: 'Sivakasi', salary: '30,000',
                maritalStatus: 'Divorced', dosham: 'Suddha Jathagam'
            },
            {
                id: 'MM24616', name: 'Rajesh Kumar', age: 29, image: 'https://dummyimage.com/300x300/4caf50/ffffff&text=Rajesh',
                zodiac: 'Kumbam', star: 'Sathayam', native: 'Madurai',
                education: 'MBA', profession: 'Bank Manager', location: 'Chennai', salary: '60,000',
                maritalStatus: 'Unmarried', dosham: 'Rahu Ketu'
            }
        ];

        this.allProfiles = [];
        for (let i = 0; i < 35; i++) {
            const base = baseProfiles[i % 3];
            this.allProfiles.push({
                ...base,
                id: `MM${24620 + i}`,
                name: `${base.name} ${i + 1}`,
                age: base.age + (i % 7),
                location: (i % 2 === 0) ? base.location : 'Chennai'
            });
        }
        this.totalProfiles = this.allProfiles.length;
    }

    handlePageEvent(e: PageEvent) {
        this.pageIndex = e.pageIndex;
        this.pageSize = e.pageSize;
        this.updateVisibleProfiles();
    }

    updateVisibleProfiles() {
        const { searchQuery, ageFrom, ageTo, location } = this.filterForm.value;

        let filtered = this.allProfiles.filter(p => {
            let matches = true;

            if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !p.id.toLowerCase().includes(searchQuery.toLowerCase())) {
                matches = false;
            }
            if (location && !p.location.toLowerCase().includes(location.toLowerCase())) {
                matches = false;
            }
            if (ageFrom && p.age < Number(ageFrom)) matches = false;
            if (ageTo && p.age > Number(ageTo)) matches = false;

            return matches;
        });

        this.totalProfiles = filtered.length;
        const startIndex = this.pageIndex * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.visibleProfiles = filtered.slice(startIndex, endIndex);

        if (window.innerWidth < 600) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    toggleLogin() {
        if (this.isLoggedIn) {
            this.authService.logout();
        } else {
            this.router.navigate(['/login']);
        }
    }

    // --- ACTIONS ---

    viewContact(profile: Profile) {
        if (this.isLoggedIn) {
            alert(`Contact Name: ${profile.name}\nPhone: +91 98765 43210`);
        } else {
            this.navigateToRegister();
        }
    }

    downloadMyProfile() {
        if (this.isLoggedIn) {
            alert('Downloading Your Profile Card (PDF/Image)...');
            // Logic: Generate PDF of current user or fetch from backend
        }
    }

    shareMyProfileWhatsapp() {
        if (this.isLoggedIn) {
            const text = "Check out my profile on Vaniya Chettiyar Kalyana Malai! ID: MY12345";
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    }

    editMyProfile() {
        if (this.isLoggedIn) {
            alert('Navigating to Edit Profile...');
        }
    }

    sendInterest(profile: Profile) {
        if (this.isLoggedIn) {
            profile.interestSent = true;
            alert(`Interest sent to ${profile.name}!`);
        } else {
            this.navigateToRegister();
        }
    }

    viewSentInterests() {
        alert('Showing IDs you have sent interest to...');
    }

    viewReceivedInterests() {
        alert('Showing IDs who are interested in you...');
    }

    navigateToRegister() {
        this.router.navigate(['/signup']);
    }
}
