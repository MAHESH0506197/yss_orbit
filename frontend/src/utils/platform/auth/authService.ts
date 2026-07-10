// yss_orbit\frontend\src\platform\auth\authService.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api/v1';

export class AuthService {
    static async getAll() {
        const response = await axios.get(`${API_URL}/auth`);
        return response.data;
    }

    static async getById(id: string) {
        const response = await axios.get(`${API_URL}/auth/${id}`);
        return response.data;
    }

    static async create(data: any) {
        const response = await axios.post(`${API_URL}/auth`, data);
        return response.data;
    }

    static async update(id: string, data: any) {
        const response = await axios.put(`${API_URL}/auth/${id}`, data);
        return response.data;
    }

    static async delete(id: string) {
        const response = await axios.delete(`${API_URL}/auth/${id}`);
        return response.data;
    }
}

