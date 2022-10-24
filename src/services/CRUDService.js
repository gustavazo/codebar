import axios from 'axios';
import config from '../config';

class CRUDService {
    constructor(model) {
        this.api = axios.create();
        this.api.defaults.baseURL = `${config.backendUrl}/${model}`;
    }

    async find(filter = {}) {
        return await this.api.get("", {
            params: {
                filter
            }
        })
    }

    async findById(id) {
        return await this.api.get(`/${id}`);
    }

    async destroy(id) {
        return await this.api.delete(`/${id}`);
    }

    async create(newModel) {
        return await this.api.post("", newModel);
    }

    async update(id, newModel) {
        return await this.api.put(`/${id}`, newModel);
    }

    async patch(id, newField) {
        return await this.api.patch(`/${id}`, newField);
    }

    async count() {
        return await this.api("/count")
    }
};

export default CRUDService;