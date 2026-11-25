import { adminApiClient } from '../lib/api-client.ts';

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  audience: 'CUSTOMER' | 'RESTAURANT' | 'ALL';
  category: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export const adminHelpApi = {
  getAll: async (audience?: string): Promise<HelpArticle[]> => {
    const url = audience && audience !== 'ALL' ? `/help/admin/all?audience=${audience}` : '/help/admin/all';
    return adminApiClient.get<HelpArticle[]>(url);
  },

  create: async (data: Partial<HelpArticle>): Promise<HelpArticle> => {
    return adminApiClient.post<HelpArticle>('/help/admin', data);
  },

  update: async (id: string, data: Partial<HelpArticle>): Promise<HelpArticle> => {
    return adminApiClient.put<HelpArticle>(`/help/admin/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await adminApiClient.delete(`/help/admin/${id}`);
  },
};
