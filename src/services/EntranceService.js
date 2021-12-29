import CRUDService from "./CRUDService";

class EntranceService extends CRUDService {
    constructor() {
        super("entrances");
    }
}

export default new EntranceService();