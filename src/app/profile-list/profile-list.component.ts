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
import { SignupService } from '../signup.service';
import { environment } from '../../environments/environment';

interface Profile {
    id: string;      // Matrimony ID
    dbId?: number;   // Numeric Database ID
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
    private signupService = inject(SignupService);

    get isLoggedIn() {
        return this.authService.isLoggedIn();
    }

    userProfileCompletion = 0;
    sentInterestsCache: any[] = []; // In-memory cache of sent interests to fetch contact numbers

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
        if (this.isLoggedIn) {
            this.loadProfilePercentage();
            this.loadBackendData();
        } else {
            this.generateMockProfiles();
            this.updateVisibleProfiles();
        }

        this.filterForm.valueChanges.subscribe(() => {
            this.pageIndex = 0;
            if (this.paginator) this.paginator.firstPage();
            this.updateVisibleProfiles();
        });
    }

    ngAfterViewInit() { }

    loadProfilePercentage() {
        const userId = this.authService.currentUser()?.id;
        if (userId) {
            this.signupService.getProfilePercentage(userId).subscribe({
                next: (res: any) => {
                    if (res && typeof res.result === 'number') {
                        this.userProfileCompletion = res.result;
                    }
                },
                error: (err) => console.error('Error loading profile percentage', err)
            });
        }
    }

    loadBackendData() {
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;

        // Fetch sent interests first so we know which profiles we liked & to cache details
        this.signupService.getSentInterests(userId).subscribe({
            next: (res: any) => {
                this.sentInterestsCache = res.result || [];
                const sentIds = this.sentInterestsCache.map((x: any) => x.likedProfileId);
                this.loadMatchedProfiles(sentIds);
            },
            error: (err) => {
                console.error('Error fetching sent interests', err);
                this.loadMatchedProfiles([]);
            }
        });
    }

    loadMatchedProfiles(sentIds: number[]) {
        // Fetch up to 100 profiles to filter and paginate locally
        this.signupService.getMatchingList(100, 0).subscribe({
            next: (res: any) => {
                const raw = res.result || [];
                this.allProfiles = raw.map((p: any) => {
                    const mapped = this.mapBackendProfile(p);
                    mapped.interestSent = sentIds.includes(p.id);
                    return mapped;
                });
                this.updateVisibleProfiles();
            },
            error: (err) => {
                console.error('Error fetching matching profiles', err);
            }
        });
    }

    mapBackendProfile(p: any): Profile {
        const career = p.careerDetails?.[0] || {};
        const zodiacDetail = p.zodiacDetails?.[0] || {};

        const age = this.calculateAge(p.dob);
        const img = p.matrimonyId
            ? `https://vc-matrimony.s3.us-east-1.amazonaws.com/profile/profileimage/${p.matrimonyId}.jpg`
            : 'https://dummyimage.com/300x300/cccccc/757575.png';

        const education = Array.isArray(career.educationDetails)
            ? career.educationDetails.join(', ')
            : (career.educationDetails || '-');

        return {
            id: p.matrimonyId || `MM${p.id}`,
            dbId: p.id,
            name: p.name,
            age: age,
            image: img,
            zodiac: zodiacDetail.zodiac?.zodiacTamil || '-',
            star: zodiacDetail.star?.starTamil || '-',
            native: p.nativePlace || '-',
            education: education,
            profession: career.profession || '-',
            location: career.workLocation || p.nativePlace || '-',
            salary: career.monthyIncome ? career.monthyIncome.toLocaleString('en-IN') : '-',
            maritalStatus: p.martialStatus || '-',
            dosham: zodiacDetail.dosham || 'Suddha Jathagam',
            interestSent: false
        };
    }

    calculateAge(dob: string | Date): number {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

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
            // Re-generate mock data on logout
            this.allProfiles = [];
            this.generateMockProfiles();
            this.updateVisibleProfiles();
        } else {
            this.router.navigate(['/login']);
        }
    }

    // --- ACTIONS ---

    viewContact(profile: Profile) {
        if (this.isLoggedIn) {
            const sentMatch = this.sentInterestsCache.find(x => x.likedProfileId === profile.dbId);
            const mobileNumber = sentMatch?.Receiver?.mobileNumber || null;
            this.router.navigate(['/profile-details'], {
                state: {
                    profile: {
                        ...profile,
                        mobileNumber: mobileNumber
                    }
                }
            });
        } else {
            this.navigateToRegister();
        }
    }

    downloadMyProfile() {
        if (this.isLoggedIn) {
            const userId = this.authService.currentUser()?.id;
            if (!userId) return;
            const url = `${environment.apiUrl}/profile/${userId}/download`;
            window.open(url, '_blank');
        }
    }

    shareMyProfileWhatsapp() {
        if (this.isLoggedIn) {
            const matId = this.authService.currentUser()?.matrimonyId || 'MY';
            const text = `Check out my profile on Vaniya Chettiyar Kalyana Malai! ID: ${matId}`;
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    }

    editMyProfile() {
        if (this.isLoggedIn) {
            // We can navigate to sign up or registration form to complete profile details
            this.router.navigate(['/register']);
        }
    }

    sendInterest(profile: Profile) {
        if (this.isLoggedIn) {
            const loggedInUserId = this.authService.currentUser()?.id;
            if (!loggedInUserId || !profile.dbId) return;

            this.signupService.sendInterest(profile.dbId, loggedInUserId).subscribe({
                next: (res) => {
                    profile.interestSent = true;
                    alert(res.message || `Interest sent to ${profile.name}!`);
                    // Refresh sent list cache to access the number
                    this.signupService.getSentInterests(loggedInUserId).subscribe((r: any) => {
                        this.sentInterestsCache = r.result || [];
                    });
                },
                error: (err) => {
                    console.error(err);
                    alert('Failed to send interest. Please try again.');
                }
            });
        } else {
            this.navigateToRegister();
        }
    }

    viewSentInterests() {
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;

        this.signupService.getSentInterests(userId).subscribe({
            next: (res: any) => {
                const raw = res.result || [];
                if (raw.length === 0) {
                    alert('You have not sent interests to any profiles yet.');
                    return;
                }
                const names = raw.map((x: any) => `${x.Receiver?.name || 'Unknown'} (${x.Receiver?.matrimonyId || ''}) - Phone: ${x.Receiver?.mobileNumber || 'Locked'}`).join('\n');
                alert(`Profiles you have sent interest to:\n\n${names}`);
            },
            error: (err) => {
                console.error(err);
                alert('Error loading sent interests.');
            }
        });
    }

    viewReceivedInterests() {
        const userId = this.authService.currentUser()?.id;
        if (!userId) return;

        this.signupService.getReceivedInterests(userId).subscribe({
            next: (res: any) => {
                const raw = res.result || [];
                if (raw.length === 0) {
                    alert('No profiles have sent interest in you yet.');
                    return;
                }
                const names = raw.map((x: any) => `${x.Sender?.name || 'Unknown'} (${x.Sender?.matrimonyId || ''}) - Phone: ${x.Sender?.mobileNumber || 'Hidden'}`).join('\n');
                alert(`Profiles interested in you:\n\n${names}`);
            },
            error: (err) => {
                console.error(err);
                alert('Error loading received interests.');
            }
        });
    }

    navigateToRegister() {
        this.router.navigate(['/signup']);
    }
}
