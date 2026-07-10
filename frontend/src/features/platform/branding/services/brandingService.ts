// yss_orbit\frontend\src\modules\branding\services\brandingService.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api/v1';

export class BrandingService {
    static async getAll() {
        const response = await axios.get(`${API_URL}/branding`);
        return response.data;
    }

    static async getById(id: string) {
        const response = await axios.get(`${API_URL}/branding/${id}`);
        return response.data;
    }

    static async create(data: any) {
        const response = await axios.post(`${API_URL}/branding`, data);
        return response.data;
    }

    static async update(id: string, data: any) {
        const response = await axios.put(`${API_URL}/branding/${id}`, data);
        return response.data;
    }

    static async delete(id: string) {
        const response = await axios.delete(`${API_URL}/branding/${id}`);
        return response.data;
    }
}
