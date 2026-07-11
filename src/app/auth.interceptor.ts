import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    if (req.url.includes('.amazonaws.com')) {
        return next(req);
    }
    const token = localStorage.getItem('auth_token');
    if (token) {
        const cloned = req.clone({
            headers: req.headers.set('Authorization', token)
        });
        return next(cloned);
    }
    return next(req);
};
