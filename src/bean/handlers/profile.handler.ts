
import { Handler } from "./handler.interface";

import { format } from 'date-fns-tz';

export class ProfileHandler implements Handler{
    private static _instance: ProfileHandler;

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

    public static getInstance():ProfileHandler{
        if(ProfileHandler._instance==undefined){
            ProfileHandler._instance = new ProfileHandler();
        }
        return ProfileHandler._instance;
    }

    setupHandlers(){
        this.before('search', 'profile',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                if(data){                    
                    data.createdBy = user.username;
                    delete data.id;
                    conn.search('profile', { createdBy: user.username }, (p:any)=>{
                        console.log('checking if profile exists', p);
                        if(p.success && p.result.length<=0){
                            let profile = {};
                            profile['password'] = '';
                            profile['confirmPassword'] = '';
                            profile['height'] = 0;
                            profile['weight'] = 0;
                            profile['createdBy'] = user.username;
                            profile['createdDate'] = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", { timeZone: 'Asia/Manila' });
                            profile['updatedBy'] = user.username;
                            profile['updatedDate'] = profile['createdDate'];
                
                            conn.create('profile', profile, (cp:any)=>{
                                if(cp.success){
                                    flowback();
                                }else{
                                    callback({success:false, message:'call.failed', cp});
                                }
                            });
                        }else if(p.success && p.result.length>0){
                            flowback();
                        }else{
                            callback({success:false, message:'call.failed', p});
                        }
                    });
                }else{
                    callback({success:false, message:'call.failed'});
                }
            }
        );


        this.before('update', 'profile',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                if(data){
                    let passwordSet = false;
                    if(data.hasOwnProperty('password') && data.hasOwnProperty('confirmPassword') && data.password && data.password.length>0){
                        passwordSet = true;
                        if(data.password!=data.confirmPassword){
                            callback({success:false, message:'password mismatch'});
                            return;
                        }
                    }
                    conn.search('profile', { createdBy: user.username, id: data.id }, (p:any)=>{
                        if(p.success && p.result.length>0){
                            let password = data.password;
                            delete data.password;
                            delete data.confirmPassword;
                            if(passwordSet){
                                conn.search('system:user', { username: user.username }, (cu:any)=>{
                                    if(cu.success && cu.result.length>0){
                                        let user = cu.result[0];
                                        user.password = password;
                                        
                                        conn.update('system:user', user, (cp:any)=>{
                                            if(cp.success){
                                                flowback();
                                            }else{
                                                callback({success:false, message:'call.failed', cp});
                                            }
                                        });
                                    }
                                })
                            }else{
                                flowback();                                  
                            }
                        }else{
                            callback({success:false, message:'call.failed', result: p});
                        }
                    });
                }else{
                    callback({success:false, message:'call.failed'});
                }
            }
        );
     
    }
}