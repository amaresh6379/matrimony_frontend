import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { SignupService } from '../signup.service';
import { ProfileStateService } from '../profile-state.service';
import { environment } from '../../environments/environment';

interface Profile {
    id: string;
    dbId?: number;
    name: string;
    age: number;
    gender: string;
    image: string;
    zodiac: string;
    star: string;
    patham: string;
    dosham: string;
    native: string;
    religion: string;
    education: string;
    profession: string;
    companyName: string;
    location: string;
    salary: string;
    maritalStatus: string;
    height: string;
    weight: string;
    foodOption: string;
    skinTone: string;
    asset: string;
    interestSent?: boolean;
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
        MatExpansionModule,
        MatInputModule,
        MatFormFieldModule,
        MatProgressBarModule
    ],
    templateUrl: './profile-list.component.html',
    styleUrl: './profile-list.component.scss'
})
export class ProfileListComponent implements OnInit, OnDestroy {
    private _fb = inject(FormBuilder);
    private router = inject(Router);
    private authService = inject(AuthService);
    private signupService = inject(SignupService);
    private profileState = inject(ProfileStateService);

    get isLoggedIn() {
        return this.authService.isLoggedIn();
    }

    userProfileCompletion = 0;
    sentInterestsCache: any[] = [];

    totalProfiles = 0;
    pageSize = 10;
    pageIndex = 0;
    visibleProfiles: Profile[] = [];
    allProfiles: Profile[] = [];

    filterForm = this._fb.group({
        searchQuery: [''],
        ageFrom: [''],
        ageTo: [''],
        location: ['']
    });

    private skipNextFilterUpdate = false;

    ngOnInit() {
        // Restore filters/page from cache before wiring up subscriptions
        if (this.profileState.filterValue) {
            this.skipNextFilterUpdate = true;
            this.filterForm.patchValue(this.profileState.filterValue, { emitEvent: false });
        }
        this.pageIndex = this.profileState.pageIndex;
        this.pageSize = this.profileState.pageSize;

        if (this.isLoggedIn) {
            this.loadProfilePercentage();
        }

        // ---- KEY FIX: use cache if we already loaded this session ----
        if (this.profileState.hasCache(this.isLoggedIn)) {
            this.allProfiles = this.profileState.allProfiles as Profile[];
            this.updateVisibleProfiles();
            this.restoreScroll();
        } else if (this.isLoggedIn) {
            this.loadBackendData();
        } else {
            this.loadProfileList();
        }

        this.filterForm.valueChanges.subscribe(() => {
            this.pageIndex = 0;
            this.updateVisibleProfiles();
        });
    }

    ngOnDestroy() {
        // Persist current filters/page so returning from profile-details doesn't reset the view
        this.profileState.filterValue = this.filterForm.value;
        this.profileState.pageIndex = this.pageIndex;
        this.profileState.pageSize = this.pageSize;
        this.profileState.scrollY = window.scrollY;
    }

    private restoreScroll() {
        if (this.profileState.scrollY) {
            setTimeout(() => window.scrollTo({ top: this.profileState.scrollY }), 0);
        }
    }

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
        this.signupService.getMatchingList(100, 0).subscribe({
            next: (res: any) => {
                const raw = res.result || [];
                this.allProfiles = raw.map((p: any) => {
                    const mapped = this.mapBackendProfile(p);
                    mapped.interestSent = sentIds.includes(p.id);
                    return mapped;
                });
                this.profileState.setCache(this.allProfiles, this.isLoggedIn);
                this.updateVisibleProfiles();
            },
            error: (err) => console.error('Error fetching matching profiles', err)
        });
    }

    loadProfileList() {
        this.signupService.getProfileList(100, 0).subscribe({
            next: (res: any) => {
                const raw = res.result || [];
                this.allProfiles = raw.map((p: any) => this.mapBackendProfile(p));
                this.profileState.setCache(this.allProfiles, this.isLoggedIn);
                this.updateVisibleProfiles();
            },
            error: (err) => console.error('Error fetching matching profiles', err)
        });
    }

    mapBackendProfile(p: any): Profile {
        const career = p.careerDetails?.[0] || {};
        const zodiacDetail = p.zodiacDetails?.[0] || {};
        const personal = p.personalDetails?.[0] || {};

        const age = this.calculateAge(p.dob);
        const img = p.profileImages?.[0]?.profileUrl ||
            (p.matrimonyId ? `https://vc-matrimony.s3.us-east-1.amazonaws.com/profile/profileimage/${p.matrimonyId}.jpg` : 'https://dummyimage.com/300x300/cccccc/757575.png');

        const education = Array.isArray(career.educationDetails)
            ? career.educationDetails.join(', ')
            : (career.educationDetails || '-');

        return {
            id: p.matrimonyId || `MM${p.id}`,
            dbId: p.id,
            name: p.name,
            age: age,
            gender: p.gender || '-',
            image: img,
            zodiac: zodiacDetail.zodiac?.zodiacTamil || '-',
            star: zodiacDetail.star?.starTamil || '-',
            patham: zodiacDetail.patham || '-',
            dosham: zodiacDetail.dosham || '-',
            native: p.nativePlace || '-',
            religion: p.religion || '-',
            education: education,
            profession: career.profession || '-',
            companyName: career.companyName || '-',
            location: career.workLocation || p.nativePlace || '-',
            salary: career.monthyIncome ? `₹${Number(career.monthyIncome).toLocaleString('en-IN')}` : '-',
            maritalStatus: p.martialStatus || '-',
            height: personal.height?.heightName || '-',
            weight: personal.weight?.weightName || '-',
            foodOption: personal.foodOption === 'VEG' ? 'Vegetarian' : (personal.foodOption === 'NONVEG' ? 'Non-Veg' : '-'),
            skinTone: personal.skinTone || '-',
            asset: personal.asset || '-',
            interestSent: false
        };
    }

    calculateAge(dob: string | Date): number {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    }

    totalPages(): number {
        return Math.ceil(this.totalProfiles / this.pageSize) || 1;
    }

    getPagesArray(): number[] {
        const total = this.totalPages();
        return Array.from({ length: total }, (_, i) => i);
    }

    goToPage(index: number) {
        this.pageIndex = index;
        this.updateVisibleProfiles();
        this.scrollToProfileList();
    }

    goToPreviousPage() {
        if (this.pageIndex > 0) {
            this.goToPage(this.pageIndex - 1);
        }
    }

    goToNextPage() {
        if (this.pageIndex < this.totalPages() - 1) {
            this.goToPage(this.pageIndex + 1);
        }
    }

    onPageSizeChange(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.pageSize = Number(selectElement.value);
        this.pageIndex = 0;
        this.updateVisibleProfiles();
        this.scrollToProfileList();
    }

    private scrollToProfileList() {
        setTimeout(() => {
            const element = document.getElementById('profile-list-start');
            if (element) {
                const yOffset = -90; // offset spacing for sticky header
                const rect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const targetY = rect.top + scrollTop + yOffset;
                window.scrollTo({ top: targetY, behavior: 'smooth' });
            }
        }, 50);
    }

    updateVisibleProfiles() {
        if (this.skipNextFilterUpdate) {
            this.skipNextFilterUpdate = false;
        }
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
    }

    toggleLogin() {
        if (this.isLoggedIn) {
            this.authService.logout();
            this.profileState.clear();
            this.allProfiles = [];
            this.loadProfileList();
        } else {
            this.router.navigate(['/login']);
        }
    }

    viewContact(profile: Profile) {
        if (this.isLoggedIn) {
            this.router.navigate(['/profile-details', profile.dbId]);
        } else {
            this.navigateToRegister();
        }
    }

    downloadMyProfile() {
        if (this.isLoggedIn) {
            const userId = this.authService.currentUser()?.id;
            if (!userId) return;
            window.open(`${environment.apiUrl}/profile/${userId}/download`, '_blank');
        }
    }

    shareMyProfileWhatsapp() {
        if (this.isLoggedIn) {
            const matId = this.authService.currentUser()?.matrimonyId || 'MY';
            const text = `Check out my profile on Vaniya Chettiyar Kalyana Malai! ID: ${matId}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }
    }

    editMyProfile() {
        if (this.isLoggedIn) {
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

    whatsappAdvertiser() {
        window.open('https://wa.me/918903960263', '_blank');
    }
    viewMyProfile() {
        const userId = this.authService.currentUser()?.id;
        if (userId) this.router.navigate(['/profile-details', userId]);
    }
}