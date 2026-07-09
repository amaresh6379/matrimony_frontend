import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../environments/environment';

interface LoginResponse {
    result: {
        success: boolean;
        status: string;
        token?: string;
        userId?: number;
    };
    success: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth/login`;

    // Reactive State
    isLoggedIn = signal<boolean>(false);
    currentUser = signal<any>(null);

    constructor(private http: HttpClient) {
        const token = localStorage.getItem('auth_token');
        const userId = localStorage.getItem('user_id');
        const matrimonyId = localStorage.getItem('matrimony_id');
        if (token && userId) {
            this.isLoggedIn.set(true);
            this.currentUser.set({ id: Number(userId), matrimonyId });
        }
    }

    login(matrimonyId: string, password: string): Observable<{ success: boolean, message?: string }> {
        const payload = {
            matrimonyId: matrimonyId,
            password: password
        };

        return this.http.post<LoginResponse>(this.apiUrl, payload).pipe(
            map(response => {
                if (response.result && response.result.success) {
                    const resData = response.result;
                    if (resData.token && resData.userId) {
                        localStorage.setItem('auth_token', resData.token);
                        localStorage.setItem('user_id', resData.userId.toString());
                        localStorage.setItem('matrimony_id', matrimonyId);
                        this.isLoggedIn.set(true);
                        this.currentUser.set({ id: resData.userId, matrimonyId: matrimonyId });
                        return { success: true };
                    }
                }
                return { success: false, message: response.result?.status || 'Invalid Credentials' };
            }),
            catchError(error => {
                console.error('Login Error:', error);
                return of({ success: false, message: 'Server Connection Failed' });
            })
        );
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('matrimony_id');
        this.isLoggedIn.set(false);
        this.currentUser.set(null);
    }
}

