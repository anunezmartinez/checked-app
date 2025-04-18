// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './auth/auth-interceptor';
import { provideToastr } from 'ngx-toastr';
import { JwtModule } from '@auth0/angular-jwt';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { ChecksModule } from './checks/checks.module';

export function tokenGetter() {
  return localStorage.getItem('access_token');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    importProvidersFrom(
      HttpClientModule,
      CoreModule,
      SharedModule,
      AuthModule,
      ChecksModule,
      JwtModule.forRoot({
        config: {
          tokenGetter: tokenGetter,
          allowedDomains: ['localhost:5000'],
          disallowedRoutes: ['localhost:5000/api/login', 'localhost:5000/api/register']
        }
      })
    )
  ]
};