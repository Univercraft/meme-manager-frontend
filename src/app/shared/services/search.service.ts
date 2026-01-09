import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  
  /**
   * Calcule la similarité entre deux chaînes (algorithme de Levenshtein normalisé)
   */
  calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = 1 - (distance / maxLength);

    return similarity;
  }

  /**
   * Vérifie si le terme de recherche correspond au début d'un mot
   * Ex: "chok" trouve "chokbar de BZ"
   */
  matchesWordStart(searchTerm: string, text: string): boolean {
    const search = searchTerm.toLowerCase().trim();
    const words = text.toLowerCase().split(/\s+/);
    
    return words.some(word => word.startsWith(search));
  }

  /**
   * Vérifie si le texte contient le terme de recherche
   */
  contains(searchTerm: string, text: string): boolean {
    return text.toLowerCase().includes(searchTerm.toLowerCase().trim());
  }

  /**
   * Calcule un score de pertinence amélioré
   * Prend en compte :
   * - Correspondance exacte (100%)
   * - Début de mot (90%)
   * - Contient le terme (80%)
   * - Similarité de Levenshtein (variable)
   */
  calculateAdvancedScore(searchTerm: string, text: string): number {
    const search = searchTerm.toLowerCase().trim();
    const target = text.toLowerCase().trim();

    // 1. Correspondance exacte
    if (target === search) {
      return 1.0;
    }

    // 2. Le texte commence par le terme de recherche
    if (target.startsWith(search)) {
      return 0.95;
    }

    // 3. Un mot commence par le terme de recherche
    if (this.matchesWordStart(search, target)) {
      return 0.90;
    }

    // 4. Le texte contient le terme
    if (this.contains(search, target)) {
      return 0.85;
    }

    // 5. Calcul de la similarité de Levenshtein
    const similarity = this.calculateSimilarity(search, target);
    
    // Bonus si les premiers caractères correspondent
    const prefixLength = Math.min(search.length, target.length);
    let prefixMatch = 0;
    for (let i = 0; i < prefixLength; i++) {
      if (search[i] === target[i]) {
        prefixMatch++;
      } else {
        break;
      }
    }
    const prefixBonus = (prefixMatch / search.length) * 0.1;

    return Math.min(similarity + prefixBonus, 1.0);
  }

  /**
   * Filtre les éléments par similarité de titre
   * Seuil ajusté à 0.65 (65%) pour plus de flexibilité
   */
  filterBySimilarity<T extends { title: string }>(
    items: T[],
    searchTerm: string,
    threshold: number = 0.65
  ): T[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return items;
    }

    return items.filter(item => {
      const score = this.calculateAdvancedScore(searchTerm, item.title);
      return score >= threshold;
    });
  }

  /**
   * Recherche avec score de pertinence amélioré
   * Retourne les éléments triés par pertinence
   */
  searchWithScore<T extends { title: string }>(
    items: T[],
    searchTerm: string,
    threshold: number = 0.65
  ): Array<T & { similarityScore: number }> {
    if (!searchTerm || searchTerm.trim() === '') {
      return items.map(item => ({ ...item, similarityScore: 1 }));
    }

    const results = items
      .map(item => ({
        ...item,
        similarityScore: this.calculateAdvancedScore(searchTerm, item.title)
      }))
      .filter(item => item.similarityScore >= threshold)
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return results;
  }
}
