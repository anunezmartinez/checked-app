// src/app/checks/check.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Check } from './models/check.model';

@Injectable({
  providedIn: 'root'
})
export class CheckService {
  private apiUrl = `${environment.apiUrl}/checks`;

  constructor(private http: HttpClient) {}

  getAllChecks(): Observable<Check[]> {
    return this.http.get<Check[]>(this.apiUrl);
  }

  getCheckById(id: string): Observable<Check> {
    return this.http.get<Check>(`${this.apiUrl}/${id}`);
  }

  createCheck(check: Partial<Check>): Observable<{message: string, check_id: string}> {
    return this.http.post<{message: string, check_id: string}>(this.apiUrl, check);
  }

  updateCheck(id: string, check: Partial<Check>): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.apiUrl}/${id}`, check);
  }

  recordCheck(id: string): Observable<{message: string, checked_at: string}> {
    return this.http.post<{message: string, checked_at: string}>(`${this.apiUrl}/${id}/record`, {});
  }

  getDueChecks(): Check[] {
    const allChecks: Check[] = JSON.parse(localStorage.getItem('cachedChecks') || '[]');
    const now = new Date();
    
    return allChecks.filter(check => {
      // If never checked, it's due
      if (!check.last_checked) {
        return true;
      }
      
      const lastChecked = new Date(check.last_checked);
      const minutesSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60);
      
      return minutesSinceLastCheck >= check.periodicity;
    });
  }

  updateLocalCache(checks: Check[]): void {
    localStorage.setItem('cachedChecks', JSON.stringify(checks));
  }
}
