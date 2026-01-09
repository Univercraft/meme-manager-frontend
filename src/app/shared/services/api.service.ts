import { Injectable } from '@angular/core';
import { FormGroup } from "@angular/forms";
import { Observable } from "rxjs";
import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }

  public async requestApi(action: string, method: string = 'GET', datas: any = {}, form?: FormGroup, httpOptions: any = {}): Promise<any> {
    const methodWanted = method.toLowerCase();
    let route = environment.directusUrl + action;

    var req: Observable<any>;

    if (httpOptions.headers === undefined) {
      const token = localStorage.getItem('directus_token');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      // Ajouter le token seulement s'il existe
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      httpOptions.headers = new HttpHeaders(headers);
    }

    switch (methodWanted) {
      case 'post':
        req = this.http.post(route, datas, httpOptions);
        break;
      case 'patch':
        req = this.http.patch(route, datas, httpOptions);
        break;
      case 'put':
        req = this.http.put(route, datas, httpOptions);
        break;
      case 'delete':
        route = this.applyQueryParams(route, datas);
        req = this.http.delete(route, httpOptions);
        break;
      default:
        route = this.applyQueryParams(route, datas);
        req = this.http.get(route, httpOptions);
        break;
    }

    if(form) {
      form.markAsPending();
    }

    return new Promise((resolve, reject) => {
      req.subscribe({
        next: (data) => {
          if (form) {
            form.enable();
            if(data.message) {
              this.setFormAlert(form, data.message, 'success');
            }
          }
          resolve(data);
          return data;
        },
        error : (error: HttpErrorResponse) => {
          console.log('Http Error : ', error);
          if(form) {
            form.enable();
            if (error.error.message) {
              this.setFormAlert(form, error.error.message, 'error');
              if(error.error.errors) {
                Object.entries(error.error.errors).forEach((entry: [string, any]) => {
                  const [key, value] = entry;
                  const keys = key.split('.');
                  let control: any = form;
                  for (let j = 0; j < keys.length; j++) {
                    control = control.controls[keys[j]];
                  }
                  if(control) {
                    if(typeof value === 'string') {
                      control.setErrors({serverError: value});
                    } else {
                      for (let i = 0; i < value.length; i++) {
                        control.setErrors({serverError: value[i]});
                      }
                    }
                  }
                });
              }
            } else {
              this.setFormAlert(form, 'Une erreur est survenue', 'error');
            }
          }
          reject(error);
        }
      });
    });
  }

  public async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('directus_token');
    
    if (!token) {
      throw new Error('Vous devez être connecté pour uploader des fichiers');
    }
    
    const headers: any = {
      'Authorization': `Bearer ${token}`
    };
    
    const httpOptions = {
      headers: new HttpHeaders(headers)
    };

    try {
      return await this.requestApi('/files', 'POST', formData, undefined, httpOptions);
    } catch (error) {
      console.error('Erreur upload file:', error);
      throw new Error('Impossible d\'uploader le fichier. Vérifiez vos permissions.');
    }
  }

  public getAssetUrl(fileId: string, transforms?: string): string {
    const baseUrl = `${environment.directusAssetsUrl}/${fileId}`;
    return transforms ? `${baseUrl}?${transforms}` : baseUrl;
  }

  private applyQueryParams(url: string, params: any): string {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      
      if (value === null || value === undefined) {
        return;
      }
      
      // Si c'est un array (comme fields), on le joint avec des virgules
      if (Array.isArray(value)) {
        queryParams.set(key, value.join(','));
      }
      // Si c'est un objet (comme filter), on le stringify en JSON
      else if (typeof value === 'object') {
        queryParams.set(key, JSON.stringify(value));
      }
      // Sinon valeur simple
      else {
        queryParams.set(key, value.toString());
      }
    });

    return `${url}?${queryParams.toString()}`;
  }

  private setFormAlert(form: FormGroup, message: string, type: 'success' | 'error'): void {
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  getItems(collection: string, params?: any): Observable<any> {
    const queryParams: any = {};
    
    if (params?.filter) {
      queryParams.filter = JSON.stringify(params.filter);
    }
    if (params?.fields) {
      queryParams.fields = params.fields.join(',');
    }
    if (params?.sort) {
      queryParams.sort = params.sort.join(',');
    }

    const token = localStorage.getItem('directus_token');
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.http.get(`${environment.directusUrl}/items/${collection}`, {
      params: queryParams,
      headers: new HttpHeaders(headers)
    }).pipe(
      map((response: any) => response.data)
    );
  }

  createItem(collection: string, data: any): Observable<any> {
    const token = localStorage.getItem('directus_token');
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.http.post(`${environment.directusUrl}/items/${collection}`, data, {
      headers: new HttpHeaders(headers)
    }).pipe(
      map((response: any) => response.data)
    );
  }

  updateItem(collection: string, id: string, data: any): Observable<any> {
    const token = localStorage.getItem('directus_token');
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.http.patch(`${environment.directusUrl}/items/${collection}/${id}`, data, {
      headers: new HttpHeaders(headers)
    }).pipe(
      map((response: any) => response.data)
    );
  }

  deleteItem(collection: string, id: string): Observable<any> {
    const token = localStorage.getItem('directus_token');
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.http.delete(`${environment.directusUrl}/items/${collection}/${id}`, {
      headers: new HttpHeaders(headers)
    });
  }
}
