import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
}

@Injectable({ providedIn: 'root' })
export class AIGenerationService {
  private readonly apiUrl = environment.OPENROUTER_API_URL;
  private readonly apiKey = environment.OPENROUTER_API_KEY;
  private readonly model = environment.OPENROUTER_MODEL;
  private http: HttpClient;

  constructor(handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  generateEntry(prompt: string, history: AIMessage[] = [], categories: string[] = [], priorities: string[] = []): Observable<AIResponse> {
    let systemPrompt = `You are an assistant that helps create structured daily observation or business (DOB) log entries. Based on the user's description, generate: title (concise, 1 short line), category, priority, and description. Return ONLY a raw JSON object with these exact fields: "title", "category", "priority", "description". Do NOT wrap it in markdown code fences or add any extra text.`;
    
    if (categories.length > 0) {
      systemPrompt += `\n\nAvailable categories (choose the closest match): ${categories.join(', ')}`;
    }
    
    if (priorities.length > 0) {
      systemPrompt += `\n\nAvailable priorities (choose one): ${priorities.join(', ')}`;
    }

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: prompt }
    ];

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'https://essentiatech.com',
      'X-Title': 'My DOB App'
    });

    const body = {
      model: this.model,
      messages: messages,
      max_tokens: 512,
      temperature: 0.7
    };

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      map(res => ({
        content: res?.choices?.[0]?.message?.content || ''
      }))
    );
  }
}
