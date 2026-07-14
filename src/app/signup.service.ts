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
    currentMatrimonyId = signal<string | null>(null);

    constructor(private http: HttpClient) { }

    // --- Step 1: Basic Profile ---
    createProfile(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/profile`, data).pipe(
            tap((res: any) => {
                const result = res?.result || res;
                if (result) {
                    if (result.id) {
                        this.currentProfileId.set(result.id);
                    }
                    if (result.matrimonyId) {
                        this.currentMatrimonyId.set(result.matrimonyId);
                    }
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

    getSignedUrl(folder: string, fileName: string, contentType: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/profile/signed-url?folder=${folder}&fileName=${fileName}&contentType=${contentType}`);
    }

    uploadFileToS3(signedUrl: string, file: File): Observable<any> {
        return this.http.put(signedUrl, file, {
            headers: {
                'Content-Type': file.type
            }
        });
    }

    // --- Matches & Interests ---
    getMatchingList(limit: number = 10, offset: number = 0, filters?: any): Observable<any> {
        let url = `${this.baseUrl}/match?limit=${limit}&offset=${offset}`;
        if (filters) {
            url += `&filterData=${encodeURIComponent(JSON.stringify(filters))}`;
        }
        return this.http.get<any>(url);
    }

    sendInterest(likedProfileId: number, loggedInUserId: number): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/match/${loggedInUserId}?interestId=${likedProfileId}`, {});
    }

    getSentInterests(loggedInUserId: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/match/${loggedInUserId}/sent`);
    }

    getReceivedInterests(loggedInUserId: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/match/${loggedInUserId}/received`);
    }

    getProfilePercentage(loggedInUserId: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/profile/${loggedInUserId}/profilePercentage`);
    }

    getProfileList(limit: number = 10, offset: number = 0, filters?: any): Observable<any> {
        let url = `${this.baseUrl}/match/profile-list?limit=${limit}&offset=${offset}`;
        if (filters) {
            url += `&filterData=${encodeURIComponent(JSON.stringify(filters))}`;
        }
        return this.http.get<any>(url);
    }
    getProfileDetails(id: number) {
        return this.http.get<any>(`${this.baseUrl}/profile/${id}`);
    }
    updateProfileDetails(id: number, data: any) {
        return this.http.put<any>(`${this.baseUrl}/profile/${id}`, data);
    }
    updateProfileImage(id: number, data: any, isProfileImage: boolean) {
        return isProfileImage ? this.http.put<any>(`${this.baseUrl}/profile/${id}/profileImage`, data) : this.http.put<any>(`${this.baseUrl}/profile/${id}/jathagamImage`, data);
    }
    updateProfileCareer(id: number, data: any) {
        return this.http.put<any>(`${this.baseUrl}/profile/${id}/career`, data);
    }
    updateProfileFamily(id: number, data: any) {
        return this.http.put<any>(`${this.baseUrl}/profile/${id}/family`, data);
    }
    updateProfileZodiac(id: number, data: any) {
        return this.http.put<any>(`${this.baseUrl}/profile/${id}/zodiac`, data);
    }
    updateProfilePersonal(id: number, data: any) {
        return this.http.put<any>(`${this.baseUrl}/profile/${id}/personal`, data);
    }
}

