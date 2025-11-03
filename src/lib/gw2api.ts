import type { GW2Skill, GW2Trait, GW2Specialization, GW2ItemStat } from '../types/gw2';

const API_BASE = 'https://api.guildwars2.com/v2';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class GW2ApiClient {
  private cache: Map<string, CacheEntry<any>> = new Map();

  private async fetchWithCache<T>(endpoint: string): Promise<T> {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      const data = await response.json();

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      this.saveToLocalStorage();

      return data;
    } catch (error) {
      // If fetch fails, try to return stale cache
      if (cached) {
        console.warn('Using stale cache due to fetch error:', error);
        return cached.data;
      }
      throw error;
    }
  }

  private saveToLocalStorage() {
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('gw2-api-cache', JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Failed to save cache to localStorage:', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem('gw2-api-cache');
      if (cached) {
        const cacheData = JSON.parse(cached);
        this.cache = new Map(cacheData);
      }
    } catch (e) {
      console.warn('Failed to load cache from localStorage:', e);
    }
  }

  constructor() {
    this.loadFromLocalStorage();
  }

  // Fetch all skills for a profession
  async getSkills(profession?: string): Promise<GW2Skill[]> {
    const allSkillIds = await this.fetchWithCache<number[]>('/skills');

    // Fetch in batches of 200 (API limit)
    const skills: GW2Skill[] = [];
    for (let i = 0; i < allSkillIds.length; i += 200) {
      const batch = allSkillIds.slice(i, i + 200);
      const batchSkills = await this.fetchWithCache<GW2Skill[]>(
        `/skills?ids=${batch.join(',')}`
      );
      skills.push(...batchSkills);
    }

    if (profession) {
      // Case-insensitive profession filter
      const profLower = profession.toLowerCase();
      return skills.filter(s =>
        s.professions && s.professions.some(p => p.toLowerCase() === profLower)
      );
    }
    return skills;
  }

  // Fetch traits for a specialization
  async getTraits(specializationId: number): Promise<GW2Trait[]> {
    const spec = await this.getSpecialization(specializationId);
    const traitIds = [...spec.minor_traits, ...spec.major_traits];

    return await this.fetchWithCache<GW2Trait[]>(
      `/traits?ids=${traitIds.join(',')}`
    );
  }

  // Fetch all specializations for a profession
  async getSpecializations(profession?: string): Promise<GW2Specialization[]> {
    const allSpecIds = await this.fetchWithCache<number[]>('/specializations');
    const specs = await this.fetchWithCache<GW2Specialization[]>(
      `/specializations?ids=${allSpecIds.join(',')}`
    );

    if (profession) {
      return specs.filter(s => s.profession === profession);
    }
    return specs;
  }

  // Fetch single specialization
  async getSpecialization(id: number): Promise<GW2Specialization> {
    return await this.fetchWithCache<GW2Specialization>(`/specializations/${id}`);
  }

  // Fetch item stats
  async getItemStats(): Promise<GW2ItemStat[]> {
    const allStatIds = await this.fetchWithCache<number[]>('/itemstats');
    return await this.fetchWithCache<GW2ItemStat[]>(
      `/itemstats?ids=${allStatIds.join(',')}`
    );
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    localStorage.removeItem('gw2-api-cache');
  }
}

// Export singleton instance
export const gw2Api = new GW2ApiClient();
