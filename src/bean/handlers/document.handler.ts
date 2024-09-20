
import { Handler } from "./handler.interface";
export class DocumentHandler implements Handler{
    private static _instance: DocumentHandler;

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

    public static getInstance():DocumentHandler{
        if(DocumentHandler._instance==undefined){
            DocumentHandler._instance = new DocumentHandler();
        }
        return DocumentHandler._instance;
    }

    setupHandlers(){
        this.before('create', 'document',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                if(data){
                    console.log('perform azure storage call here...', data, files);
                    for(let i=0;i<files.length;i++){
                        data[files[i].fieldname] = files[i].buffer.toString('base64');
                    }
                    flowback();
                }else{
                    callback({success:false, message:'call.failed'});
                }
            }
        );

        this.before('update', 'document',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                if(data){
                    console.log('perform azure storage call here...', data, files);
                    for(let i=0;i<files.length;i++){
                        data[files[i].fieldname] = files[i].buffer.toString('base64');
                    }
                    flowback();
                }else{
                    callback({success:false, message:'call.failed'});
                }
            }
        );        

        this.after('create', 'document',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, p:any, callback:Function) => {
                if(p.success && p.result.length>0){
                    console.log('success created', p);
                }
                callback(p);
            }
        );

        this.after('update', 'document',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, p:any, callback:Function) => {
                if(p.success && p.result.length>0){
                    console.log('success updated', p);
                }
                callback(p);
            }
        );         
    }
}