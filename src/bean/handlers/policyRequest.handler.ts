import { CCMHelper } from "../helpers/ccm.helper";
import { Handler } from "./handler.interface";

export class PolicyRequestHandler implements Handler{
    private static _instance: PolicyRequestHandler;

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

    public static getInstance():PolicyRequestHandler{
        if(PolicyRequestHandler._instance==undefined){
            PolicyRequestHandler._instance = new PolicyRequestHandler();
        }
        return PolicyRequestHandler._instance;
    }

    setupHandlers(){
      
        this.after('create', 'policyRequest',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, p:any, callback:Function) => {
                console.log('CREATE POLICYREQUEST HAS BEEN TRIGGERED')
                if(data){
                    console.log('data CREATE policyRequest', data);

                ///    var policyRef = data;

                //     CCMHelper.getPolicyDetails(policyRef);
                //         //format policy details as here priof calling callback
                //         // id	id which passed by partner from the request
                //         // policyNumber	Policy number from LAS
                //         // applicationNumber	Application number from LAS
                //         // policyStatus	Policy status from LAS
                //         // policyOwner	PO name from LAS
                //         // policyOwnerIdType	PO's ID type from LAS whether it's Passport, National ID or any other doc type
                //         // policyOwnerIdNo	PO's ID number from LAS
                //         // policyOwnerNation	PO's nationality from LAS
                //         // payer	Payer name
                //         // payerIdType	Payer's ID type from LAS whether it's PassPayerrt, National ID or any other doc type
                //         // payerIdNo	Payer's ID number from LAS
                //         // payerNation	Payer's nationality from LAS
                //         // dueDate	Due date from LAS???
                //         // premiumType	Value base on policy status
                //         // paymentStatus	Payment status based on the current due date
                //         // minAmount	
                //         // totalDueAmount	
                //         // frequency	
                //         // payable	true
                //         // currency	Currency from LAS (MMK)

                        
                        callback(p); 
                    
                }
                else {
                    callback(p);
                }
            }
        );
         
    }
}