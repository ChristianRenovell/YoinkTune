import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';

interface SearchResult {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  url: string;
  platform: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    ProgressBarModule,
    SelectButtonModule,
    SkeletonModule
  ],
  styleUrls: ['./app.component.scss'],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private http = inject(HttpClient);

  query = '';
  platformOptions = [
    { label: 'YouTube', value: 'youtube' },
    { label: 'SoundCloud', value: 'soundcloud' }
  ];
  selectedPlatform = 'youtube';

  results: SearchResult[] = [];
  loading = false;
  downloadingId: string | null = null;
  errorMsg = '';

  search() {
    if (!this.query.trim()) return;
    
    this.loading = true;
    this.results = [];
    this.errorMsg = '';
    
    this.http.get<SearchResult[]>(`${environment.apiUrl}/api/search`, {
      params: { q: this.query, platform: this.selectedPlatform }
    }).subscribe({
      next: (res) => {
        this.results = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Ocurrió un error al realizar la búsqueda.';
        this.loading = false;
      }
    });
  }

  download(result: SearchResult) {
    this.downloadingId = result.id;
    
    const url = `${environment.apiUrl}/api/download?url=${encodeURIComponent(result.url)}&title=${encodeURIComponent(result.title)}`;
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Simulate completion after a bit (since streaming starts immediately)
    setTimeout(() => {
      this.downloadingId = null;
    }, 2000);
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}
