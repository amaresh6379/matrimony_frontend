import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';

interface LoginResponse {
    result: {
        success: boolean;
        status: string;
    };
    success: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://54.92.214.248:5000/v1/auth/login';

    // Reactive State
    isLoggedIn = signal<boolean>(false);
    currentUser = signal<any>(null);

    constructor(private http: HttpClient) { }

    login(matrimonyId: string, password: string): Observable<{ success: boolean, message?: string }> {
        const payload = {
            matrimonyId: matrimonyId,
            password: password
        };

        return this.http.post<LoginResponse>(this.apiUrl, payload).pipe(
            map(response => {
                // Check both top-level success and nested result.success based on payload structure
                // Payload: { "result": { "success": false, "status": "INVALID" }, "success": true }
                // It seems 'success: true' generally means the API call worked, but result.success indicates logic.
                // Wait, typical structure might be result.success = true for valid login. 
                // Let's assume result.status === 'VALID' or result.success === true is the key.

                // Based on user request: 
                // Failure: { "result": { "success": false, "status": "INVALID" }, "success": true }

                if (response.result && response.result.success) {
                    this.isLoggedIn.set(true);
                    this.currentUser.set({ id: matrimonyId }); // Mock user object for now
                    return { success: true };
                } else {
                    return { success: false, message: response.result?.status || 'Invalid Credentials' };
                }
            }),
            catchError(error => {
                console.error('Login Error:', error);
                return of({ success: false, message: 'Server Connection Failed' });
            })
        );
    }

    logout() {
        this.isLoggedIn.set(false);
        this.currentUser.set(null);
    }
}
