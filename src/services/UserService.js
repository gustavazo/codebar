import CRUDService from './CRUDService';
import conf from '../conf';

class UserService extends CRUDService {
    constructor() {
        super("users");
    }

    getClasses(id, filter = {}) {
        return this.api.get("/" + id + "/classe-instances", {
            params: {
                filter
            }
        });
    }

    getPayments(id, filter = {}) {
        return this.api.get("/" + id + "/payments", {
            params: {
                filter
            }
        });
    }

    async getPlan(id) {
        return await this.api.get("/" + id + "/plans");
    }

    async createPlan(plan) {
        return await this.http.post("/user-plans", plan);
    }

    async patchUserPlan(id, plan) {
        return await this.http.patch("/user-plans/" + id, plan);
    }

    async getUserPlans(id) {
        return await this.http.get("/user-plans/" + id);
    }

    async getBills(id, filter = {}) {
        return await this.api.get("/" + id + "/bills", {
            params: {
                filter
            }
        });
    }
    
    async login(credentials) {
        return await this.api.post("/login", credentials);
    }

    async findUserSuscriptions(filter = {}) {
        return this.api.get(conf.backendUrl + "/" + "user-plans", {
            params: {
                filter: {
                    where: filter
                }
            }
        })
    }
}

export default new UserService();