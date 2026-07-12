import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProfileStateService {
    allProfiles: any[] | null = null;
    isLoggedInSnapshot: boolean | null = null;
    filterValue: any = null;
    pageIndex = 0;
    pageSize = 10;
    scrollY = 0;

    hasCache(isLoggedIn: boolean): boolean {
        return this.allProfiles !== null && this.isLoggedInSnapshot === isLoggedIn;
    }

    setCache(profiles: any[], isLoggedIn: boolean) {
        this.allProfiles = profiles;
        this.isLoggedInSnapshot = isLoggedIn;
    }

    clear() {
        this.allProfiles = null;
        this.isLoggedInSnapshot = null;
        this.filterValue = null;
        this.pageIndex = 0;
        this.scrollY = 0;
    }
}