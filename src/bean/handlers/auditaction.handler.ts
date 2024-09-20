
import { Handler } from "./handler.interface";
export class AuditActionHandler implements Handler{
    private static _instance: AuditActionHandler;

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

    public static getInstance():AuditActionHandler{
        if(AuditActionHandler._instance==undefined){
            AuditActionHandler._instance = new AuditActionHandler();
        }
        return AuditActionHandler._instance;
    }

    setupHandlers(){
        
        this.after('search', 'system:auditaction',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, p:any, callback:Function) => {
                if(p){
                    let monitor: any = conn.getMonitor();
                    let list: any = [];
                    p.monitor = {
                        connections: monitor.connectionList.length,
                        elapsed: monitor.getTimes()
                    }
                }
                callback(p);
            }
        );         
    }
}