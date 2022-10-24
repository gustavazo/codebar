import config from "../config";
import CRUDService from "./CRUDService";

class PlanService extends CRUDService {
  constructor() {
    super("plans");
  }

  async find(filter) {
    return await this.api.get(config.backendUrl + "/plansAll", {
      params: {
        filter: filter
      }
    });
  }
}

export default new PlanService();
