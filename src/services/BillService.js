import CRUDService from "./CRUDService";
import config from "../config";
class BillService extends CRUDService {
   constructor() {
      super("bills");
   }

   async getPaymets(billId) {
      return this.http.get(config.backendUrl +"/payments", {
         params: {
            filter: {
               where: {
                  billId
               }
            }
         }
      });
   }
}

export default new BillService();