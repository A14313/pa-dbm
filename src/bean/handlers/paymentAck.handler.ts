import { CCMHelper } from "../helpers/ccm.helper";
import { Handler } from "./handler.interface";
import { ConsoleHelper } from "../helpers/console.helper";
import { v4 as uuidv4 } from 'uuid';

export class PaymentAckHandler implements Handler{
    private static _instance: PaymentAckHandler;

    beforeCalls: Object = {};
    afterCalls: Object = {};
    
    private constructor(){
        this.setupHandlers();
    }
    

    hasBefore(action: string, bean: string):boolean{
        return this.beforeCalls.hasOwnProperty(action+'::'+bean);
    }

    hasAfter(action: string, bean: string):boolean{
        return this.afterCalls.hasOwnProperty(action+'::'+bean);
    }  
    
    getBefore(action: string, bean: string):Function{
        return this.beforeCalls[action+'::'+bean];
    }

    getAfter(action: string, bean: string):Function{
        return this.afterCalls[action+'::'+bean];
    }     

    before(action:string, bean:string, handle:Function){
        this.beforeCalls[action+'::'+bean] = handle;
    }

    after(action:string, bean:string, handle:Function){
        this.afterCalls[action+'::'+bean] = handle;
    }

    public static getInstance():PaymentAckHandler{
        if(PaymentAckHandler._instance==undefined){
            PaymentAckHandler._instance = new PaymentAckHandler();
        }
        return PaymentAckHandler._instance;
    }

    setupHandlers(){
      
        this.after('create', 'paymentAck',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, p:any, callback:Function) => {
                
                if(p.success){
                    ConsoleHelper.log("CREATE paymentAck SUCCESS", p);

                    var paymentAckSuccess = {
                        success: true,
                        message: "payment received.",
                        result: {
                            requestId: p.result.requestId,
                            code: "",
                            receiptCode: uuidv4()
                        }	
                    }
                    
                    callback(paymentAckSuccess); 
                }
                else {
                    ConsoleHelper.log("CREATE paymentAck FAILED", p);

                    var paymentAckFailed = {
                        success: false,
                        message: "payment failed",
                        result: {
                            requestId: p.result.requestId,
                            code: "",
                            receiptCode: ""
                        }	
                    }

                    callback(paymentAckFailed);
                }
            }
        );
         
    }
}