import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SignupService {
    private baseUrl = environment.apiUrl;

    // State to track the Profile ID created in Step 1
    currentProfileId = signal<number | null>(null);

    constructor(private http: HttpClient) { }

    // --- Step 1: Basic Profile ---
    createProfile(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/profile`, data).pipe(
            tap((res: any) => {
                // Assuming the response contains the ID. The user example didn't show output for Step 1 explicitly,
                // but implied subsequent calls use /profile/13/... so we need to capture ID.
                // Let's assume response.result.id or response.id or similar. 
                // I will log it and try to find 'id' in the response.
                // Common pattern: res.result.id
                if (res && res.result && res.result.id) {
                    this.currentProfileId.set(res.result.id);
                } else if (res && res.id) {
                    this.currentProfileId.set(res.id);
                }
            })
        );
    }

    getDistricts(): Observable<any[]> {
        return this.http.get<any>(`${this.baseUrl}/district`).pipe(
            map(res => res.result)
        );
    }

    // --- Step 2: Career ---
    saveCareer(data: any): Observable<any> {
        const id = this.currentProfileId();
        if (!id) throw new Error('Profile ID not found');
        return this.http.post(`${this.baseUrl}/profile/${id}/career`, data);
    }

    // --- Step 3: Family ---
    saveFamily(data: any): Observable<any> {
        const id = this.currentProfileId();
        if (!id) throw new Error('Profile ID not found');
        return this.http.post(`${this.baseUrl}/profile/${id}/family`, data);
    }

    // --- Step 4: Zodiac ---
    getZodiacs(): Observable<any[]> {
        return this.http.get<any>(`${this.baseUrl}/zodiac`).pipe(map(res => res.result));
    }

    getStars(): Observable<any[]> {
        return this.http.get<any>(`${this.baseUrl}/star`).pipe(map(res => res.result));
    }

    saveZodiac(data: any): Observable<any> {
        const id = this.currentProfileId();
        if (!id) throw new Error('Profile ID not found');
        return this.http.post(`${this.baseUrl}/profile/${id}/zodiac`, data);
    }

    // --- Step 5: Personal ---
    getHeights(): Observable<any[]> {
        return this.http.get<any>(`${this.baseUrl}/height`).pipe(map(res => res.result));
    }

    getWeights(): Observable<any[]> {
        return this.http.get<any>(`${this.baseUrl}/weight`).pipe(map(res => res.result));
    }

    savePersonal(data: any): Observable<any> {
        const id = this.currentProfileId();
        if (!id) throw new Error('Profile ID not found');
        return this.http.post(`${this.baseUrl}/profile/${id}/personal`, data);
    }

    // --- Step 6: Profile Image ---
    saveProfileImage(data: any): Observable<any> {
        const id = this.currentProfileId();
        if (!id) throw new Error('Profile ID not found');
        return this.http.post(`${this.baseUrl}/profile/${id}/profileImage`, data);
    }

}
