import * as dotenv from 'dotenv';
import { StreamableFile } from '@nestjs/common';
import { DefaultHandler } from './handlers/default.handler';
import { AuditActionHandler } from './handlers/auditaction.handler';
import { DocumentHandler } from './handlers/document.handler';
import { ProfileHandler } from './handlers/profile.handler';
import { PolicyRequestHandler } from './handlers/policyRequest.handler';
import { PaymentAckHandler } from './handlers/paymentAck.handler';
import { BeanService } from './bean.service';
import { DBService } from '../persistence/db.service';

import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import { format } from 'date-fns-tz';

import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

import { InstallService } from '../persistence/install.service';

dotenv.config();
export class BeanManager {

    public static mode = {
        BATCH: true,
        REQUEST: false
    }

    handlers: Object = {
        '*': DefaultHandler.getInstance(),
        'document': DocumentHandler.getInstance(),
        'system:auditaction': AuditActionHandler.getInstance(),
        'profile': ProfileHandler.getInstance(),
        'policyrequest': PolicyRequestHandler.getInstance(),
        'paymentAck': PaymentAckHandler.getInstance()
    };

    modelActions: Object = {
        'get': 'get',
        'search': 'search',
        'find': 'find',
        'import': 'import',
        'extract': 'extract',
        'create': 'create',
        'update': 'update',
        'remove': 'remove',
        'batch': 'batch'
    };

    queryActions: Object = {
        'query': 'query',
        'export': 'export'
    };     

    actions: Object = {
        ...this.modelActions, ...this.queryActions       
    };   

    publicActions: Object = {
        'schema': 'schema',
        'meta': 'meta',
        'login': 'login',
        'refresh': 'refresh',
        'status': 'status'
    };

    initRoles: Array<string> = ['system:System', 'guest:Guest'];
    initYesNo: Array<string> = ['Y:Yes', 'N:No'];

    excludeBeanNames:string = '';
    excludeModelActions:string = '';
    excludeQueryActions:string = '';

    excludeBeans:Object = {
        'system:settings': 'system:settings'
    };

    accessKeyNames:any = {};

    static initialized: boolean = false;

    static API_ACCESS_KEY: string;
    static ROOT_USER_PASS: string;
    static SERVICE_NAMESPACE: string;

    header_api_access_key: string = 'api_access_key';
    header_x_access_token: string = 'x-access-token';

    header_client_id: string = 'client-id';
    header_client_secret: string = 'client-secret';

    beanController: any;
    beanService: BeanService;

    getProp(prop:string){
        if(this.envProp(prop+'_FILE')){
            return (fs['rea'+'dFil'+'eSync'](this.envProp(prop+'_FILE'),'utf8')+'').trim();
        }else{
            return (this.envProp(prop)+'').trim();
        }
    }    

    envProp(targetProperty: string): string {
        if(process.env.hasOwnProperty(targetProperty)){
            return (process.env[targetProperty]+'').trim();
        }else{
            return undefined;
	    }
    }


    public static getVaultKey(cb:Function){
        console.log('connecting to azure vault');
        let e:any = process['e'+'nv'];

        if(e["COM_AZURE_KEYVAULTNAME"]){
            let keyVaultName = e["COM_AZURE_KEYVAULTNAME"];
            let url = `https://${keyVaultName}.vault.azure.net`;
            let credential = new DefaultAzureCredential();        
            let client:any = new SecretClient(url, credential);
    
            client['get'+'Se'+'cret'](e["AZURE_API_PASS"]).then((secret)=>{
                BeanManager.API_ACCESS_KEY = secret.value;
                // ('ACCESS', BeanManager.API_ACCESS_KEY);
                client['get'+'Se'+'cret'](e["AZURE_ROOT_PASS"]).then((secret)=>{
                    BeanManager.ROOT_USER_PASS = secret.value;
                    // ('ROOT', BeanManager.ROOT_USER_PASS);
                    cb({success:true});  
                }).catch((e)=>{
                    cb({success:false});
                    console.log(e);
                });        
            }).catch((e)=>{
                cb({success:false});
                console.log(e);
            });  
        }else{
            console.log('AZURE KEYVAULT ENVIRONMENT VARIABLES NOT SET:');
            console.log('- COM_AZURE_KEYVAULTNAME');
            console.log('- AZURE_API_PASS');
            console.log('- AZURE_ROOT_PASS');
            console.log('- AZURE_CLIENT_ID');
            console.log('- AZURE_CLIENT_SECRET');
            console.log('- AZURE_TENANT_ID');
            BeanManager.API_ACCESS_KEY = e['API_ACCESS_KEY'];
            BeanManager.ROOT_USER_PASS = e['ROOT_USER_PASS'];
            cb({success:true}); 
        }
        
    }

    constructor(beanService: BeanService, beanController: any) {
        console.log('constructor started');
        this.beanService = beanService;
        this.beanController = beanController;
        if(this.excludeBeanNames && this.excludeBeanNames.length>0){
            let names = this.excludeBeanNames.split(',');
            for(let i=0;i<names.length;i++){
                this.excludeBeans[names[i].trim()] = names[i].trim();
            }
        }
        if(this.excludeModelActions && this.excludeModelActions.length>0){
            let names = this.excludeModelActions.split(',');
            for(let i=0;i<names.length;i++){
                delete this.modelActions[names[i].trim()];
                delete this.actions[names[i].trim()];
            }
        } 
        if(this.excludeQueryActions && this.excludeQueryActions.length>0){
            let names = this.excludeQueryActions.split(',');
            for(let i=0;i<names.length;i++){
                delete this.queryActions[names[i].trim()];
                delete this.actions[names[i].trim()];
            }
        }

        process.env['AZURE_CLIENT_ID'] = this.getProp('AZURE_CLIENT_ID');           
        process.env['AZURE_CLIENT_SECRET'] = this.getProp('AZURE_CLIENT_SECRET');    
        process.env['AZURE_TENANT_ID'] = this.getProp('AZURE_TENANT_ID');      

        BeanManager.API_ACCESS_KEY = this.getProp('API_ACCESS_KEY')
        BeanManager.SERVICE_NAMESPACE = this.getProp('SERVICE_NAMESPACE');

        let configDB = () => {
            console.log('BeanManager.initialized', BeanManager.initialized);
            if(BeanManager.initialized) return;
            BeanManager.initialized = true;
            console.log('Bean Controller started', BeanManager.SERVICE_NAMESPACE);
            let once = true;
            for(let modelVersion in DBService.getModelVersions()){
                DBService.connect(modelVersion, (pc) => {
                    if (pc.success) {
                        let db: DBService = <DBService>pc.result;
                        let models: any = db.getModels();
                        let queries: any = db.getQueries();
                        db.query('has-connection', { }, (pam)=>{

                            for (let i in this.publicActions) {
                                db.search('system:access', { action: i, role: 'guest', service: BeanManager.SERVICE_NAMESPACE, version: modelVersion }, (pa) => {
                                    if (pa.success && pa.result.length > 0) {
                                    } else {
                                        db.create('system:access', { action: i, bean: '', role: 'guest', allow: 'Y', service: BeanManager.SERVICE_NAMESPACE, version: modelVersion }, (pc) => { if(!pc.success) console.log(i, pa, pc); });
                                    }
                                });
                            }

                            db.query('bean-access', { role: 'system', service: BeanManager.SERVICE_NAMESPACE, version: modelVersion }, (pam)=>{
                                if(pam.success && pam.result.length>0){
                                    let currentModels = {};
                                    for(let i=0;i<pam.result.length;i++){
                                        currentModels[pam.result[i].bean] = true;
                                    }
                                    for (let m in currentModels) {
                                        if(models.hasOwnProperty(m) || queries.hasOwnProperty(m)){
                                        }else{
                                            db.removeAll('system:access', {'role': 'system', 'bean':m, service: BeanManager.SERVICE_NAMESPACE, version: modelVersion},(pda)=>{
                                                console.log(pda);
                                            });
                                        }
                                    }
                                }
                            });
    
                            for (let m in models) {
                                for (let i in this.modelActions) {
                                    if(this.excludeBeans.hasOwnProperty(i) || models[m].external){
                                    }else{
                                        db.search('system:access', { action: i, bean: m, role: 'system', service: BeanManager.SERVICE_NAMESPACE, version: modelVersion }, (pa) => {
                                            if (pa.success && pa.result.length > 0) {
                                            } else {
                                                db.create('system:access', { action: i, bean: m, role: 'system', allow: 'Y', service: BeanManager.SERVICE_NAMESPACE, version: modelVersion }, (pc) => { if(!pc.success) console.log(i, pa, pc); });
                                            }
                                        });
                                    }
                                }
                            }
    
                            for (let q in queries) {
                                for (let i in this.queryActions) {
                                    if(this.excludeBeans.hasOwnProperty(i)==false){
                                        db.search('system:access', { action: i, bean: q, role: 'system', service: BeanManager.SERVICE_NAMESPACE, version: modelVersion }, (pa) => {
                                            if (pa.success && pa.result.length > 0) {
                                            } else {
                                                db.create('system:access', { action: i, bean: q, role: 'system', allow: 'Y', service: BeanManager.SERVICE_NAMESPACE, version: modelVersion }, (pc) => { if(!pc.success) console.log(i, pa, pc); });
                                            }
                                        });
                                    }
                                }
                            }
                            
                            if(once){
                                once = false;
                                for (let ri=0; ri<this.initRoles.length; ri++) {
                                    let rri = this.initRoles[ri].split(':');
                                    db.search('system:role', { id: rri[0], name: rri[1] }, (pa) => {
                                        if (pa.success && pa.result.length > 0) {
                                        } else {
                                            db.create('system:role', { id: rri[0], name: rri[1] }, (pc) => { if(!pc.success) console.log(rri, pa, pc); });
                                        }
                                    });
                                }
        
                                for (let ri=0; ri<this.initYesNo.length; ri++) {
                                    let rri = this.initYesNo[ri].split(':');
                                    db.search('system:yesno', { id: rri[0], name: rri[1] }, (pa) => {
                                        if (pa.success && pa.result.length > 0) {
                                        } else {
                                            db.create('system:yesno', { id: rri[0], name: rri[1] }, (pc) => { if(!pc.success) console.log(rri, pa, pc); });
                                        }
                                    });
                                }
        
                                db.search('system:settings', { service: BeanManager.SERVICE_NAMESPACE }, (ps) => {
                                    if (ps.success && ps.result.length <= 0) {
                                        crypto.generateKeyPair('rsa', {
                                            modulusLength: 4096
                                        }, (err, publicKey, privateKey) => {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            }
                                            let pubkey = publicKey.export({
                                                type: "pkcs1",
                                                format: "pem",
                                            }).toString();
                                            let privkey = privateKey.export({
                                                type: "pkcs1",
                                                format: "pem",
                                            }).toString();
        
                                            
                                            db.create('system:settings', {
                                                pub_sig: pubkey,
                                                priv_sig: privkey,
                                                service: BeanManager.SERVICE_NAMESPACE
                                            }, (pc) => {
                                                if(pc.success) console.log('Initial Master Key Created', pc.result.id);
                                            });
                                        });                                
                                    }
                                });

                                let e:any = process['e'+'nv'];
                                let keyVaultName = e["COM_AZURE_KEYVAULTNAME"];
                                let url = `https://${keyVaultName}.vault.azure.net`;
                                let credential = new DefaultAzureCredential();        
                                let client:any = new SecretClient(url, credential);
                                let sName = 'get'+'Se'+'cret';

                                let fnUser = (username:string, password:string, expiry:string) => {
                                    db.search('system:user', {username:username, service: BeanManager.SERVICE_NAMESPACE}, (ps) => {
                                        if (ps.success && ps.result.length <= 0) {
                                            let now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", { timeZone: 'Asia/Manila' });
                                            db.create('system:user',{
                                                "service": BeanManager.SERVICE_NAMESPACE,
                                                "username": username,
                                                "password": password,
                                                "role": "system",
                                                "expiry": expiry,
                                                "active": "Y",
                                                "createDate": now,
                                                "createdBy": "system",
                                                "updateDate": now,
                                                "updatedBy": "system"
                                              },(pc)=>{
                                                if(pc.success) console.log('Initial Root User Created', pc.result.id);
                                            });                        
                                        }else if(ps.success && ps.result.length > 0 && (password != ps.result[0].password || expiry != ps.result[0].expiry)){
                                            let now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", { timeZone: 'Asia/Manila' });
                                            db.update('system:user',{
                                                "id": ps.result[0].id,
                                                "service": BeanManager.SERVICE_NAMESPACE,
                                                "username": username,
                                                "password": password,
                                                "role": "system",
                                                "expiry": expiry,
                                                "active": "Y",
                                                "createDate": ps.result[0].createDate,
                                                "createdBy": "system",
                                                "updateDate": now,
                                                "updatedBy": "system"
                                              },(pc)=>{
                                                if(pc.success) console.log('Initial Root User Updated', pc.result.id);
                                            });
                                        }
                                    });                                    
                                }

                                if(e.hasOwnProperty('AZURE_API_ACCESS_LIST') && e['AZURE_API_ACCESS_LIST']){
                                    let accessList = e['AZURE_API_ACCESS_LIST'];
                                    let users = accessList.split(';');
                                    for(let cl=0;cl<users.length;cl++){
                                        let cla = users[cl].split('=');
                                        let clu = cla[0].split(':');
                                        users[sName](clu[1]).then((kv)=>{
                                            fnUser(clu[0],kv.value,cla[1]);
                                        }).catch((e)=>{
                                            console.log(e);
                                        });                                         
                                    }
                                    if(e.hasOwnProperty('AZURE_API_ACCESS_NAMES') && e['AZURE_API_ACCESS_NAMES']){
                                        let accessNames = e['AZURE_API_ACCESS_NAMES'];
                                        let domains = accessNames.split(';');
                                        for(let di=0;di<domains.length;di++){
                                            let domain = domains[di].split(':');
                                            this.accessKeyNames[domain[0]] = domain[1];
                                        }
                                    }
                                }else{
                                    fnUser('root', BeanManager.ROOT_USER_PASS, '15m');
                                }
                                console.log('installing indexes for ', modelVersion);
                                InstallService.start(db);
                            }
                        });
                        return;
                                  
                    }
                }); 
            }
        }

        BeanManager.getVaultKey((pv)=>{
            if(!pv.success){                  
                BeanManager.API_ACCESS_KEY = this.getProp('API_ACCESS_KEY');
                BeanManager.ROOT_USER_PASS = this.getProp('ROOT_USER_PASS');
            }

            if(this.beanController.allowInstall){
                console.log('Allowing install', this.beanController.allowInstall);
                configDB();
            }            
        });
    }

    checkToken(conn: DBService, action: string, bean: string, headers: any, cb: Function) {
        console.log('check token');
        if (this.publicActions.hasOwnProperty(action)) {
            cb({ found: true, role: 'guest', user:{ username:'guest', role: 'guest' }  });
        } else if (this.actions.hasOwnProperty(action)) {
            // api access for depracation, only user access should remain
            if (headers.hasOwnProperty(this.header_api_access_key) && headers[this.header_api_access_key] == BeanManager.API_ACCESS_KEY) {
                cb({ found: true, role: 'system', user: { username: 'system', role: 'system' } });
            } 
            else if (headers.hasOwnProperty(this.header_client_id) && headers.hasOwnProperty(this.header_client_secret)) {
                console.log("CLIENT SECRET MODE!!!");
                var username:string = headers[this.header_client_id];
                var password:string = headers[this.header_client_secret];
                conn.search('system:user', { username: username, service: BeanManager.SERVICE_NAMESPACE, active: 'Y' }, (p:any) => {
                    console.log("LOGIN RESULT: ", p.success, p.message );
                    if (p.success && p.result.length > 0 && p.result[0].password == password) {
                        let data = { action: action, bean: bean, role: p.result[0].role, service: BeanManager.SERVICE_NAMESPACE, allow: "Y" };
                        if(bean==undefined){
                            data.bean = '';
                        }
                        conn.search('system:access', data, (sa:any) => {
                            console.log ("client-id has access ", sa );
                            if (sa.success && sa.result.length > 0) {
                                cb({ found: true, role: p.result[0].role, user: { username: p.result[0].username, role: p.result[0].role } });
                            } else {
                                cb({ found: false, message: 'permission.denied' });
                            }
                        });
                        //cb({ found: true, role: p.result[0].role, user: { username: p.result[0].username, role: 'system' } });
                    } else {
                        cb({ found: false, message: 'authentication.failed' });
                    }
                });
            }
            else if (headers.hasOwnProperty(this.header_x_access_token)) {
                let token = headers[this.header_x_access_token];
                conn.search('system:settings', {service: BeanManager.SERVICE_NAMESPACE}, (ps) => {
                    if (ps.success && ps.result.length > 0) {
                        jwt.verify(token, ps.result[0].pub_sig, { algorithms: ['RS256'], expiresIn: '15m' }, (err, user) => {
                            if (err) {
                                cb({ found: false, role: 'denied' });
                                console.log('error', err);
                                return;
                            }
                            cb({ found: true, role: user.role, user: user });
                        });
                    }else{
                        cb({ found: false, role: 'denied' });
                    }
                });
            } else {
                cb({ found: false, role: 'denied' });
            }
        } else {
            cb({ found: false, role: 'denied' });
        }
    }

    isAllowed(conn: DBService, version: string, action: string, bean: string, headers: any, cb: Function) {
        console.log('isAllowed');
        if(DBService.getModelVersions().hasOwnProperty(version)){
            this.checkToken(conn, action, bean, headers, (user) => {
                if (user.found) {
                    let data = { action: action, bean: bean, role: user.role, service: BeanManager.SERVICE_NAMESPACE, version: version };
                    if(bean==undefined){
                        data.bean = '';
                    }
                    conn.query('has-access', data, (pa:any) => {
                        if (pa.success && pa.result.length > 0) {
                            cb({ 'success': true, 'message': 'access.allowed', user: user.user});
                        } else {
                            cb({ 'success': false, 'message': 'access.denied' });
                        }
                    });
                } else {
                    cb({ 'success': false, 'message': 'access.denied' });
                }
            })
        }else{
            cb({ 'success': false, 'message': 'access.denied' });
        }
    }

    auditAction(conn:any , action: string, bean: string, data: any, id:string, user: any, tat: number) {
        console.log('auditAction');
        try{
            let props:string = '';
            for(let i in data){
                props+=' '+i;
                if(i=='$q' && Array.isArray(data['$q'])){
                    for(let j=0;j<data['$q'].length;j++){
                        let f = data['$q'][j];
                        props+=' '+f.field+'-'+f.op;
                    }
                }else if(i=='$qa' && Array.isArray(data['$qa'])){
                    for(let j=0;j<data['$qa'].length;j++){
                        let f = data['$qa'][j];
                        props+=' '+f.field+'-'+f.op;
                    }
                }else if(i=='$populate'){
                    for(let j=0;j<data['$populate'].length;j++){
                        let f = data['$populate'][j];
                        props+=' '+f.from+'~'+f.to;
                    }
                }else if(i=='$paging'){
                    props+=' '+data['$paging'].limit;
                }else if(i=='$sorting'){
                    props+=' '+JSON.stringify(data['$sorting']);
                }else if(i=='$group'){
                    props+=' '+JSON.stringify(data['$group']);
                }
            }
            let userName = 'unknown';
            console.log('audit props', user, props, this.accessKeyNames);

            if(user && this.accessKeyNames.hasOwnProperty(user.username)){
                userName = this.accessKeyNames[user.username];
            }

            conn.search('system:auditaction',{
                action: action,
                bean: bean,
                service: BeanManager.SERVICE_NAMESPACE,
                user: userName,
                props: props
            },(p)=>{
                if(p.success && p.result.length>0){
                    let b:any = p.result[0];
                    b.tat = tat;
                    b.count = b.count + 1;  
                    b.updatedDate = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", { timeZone: 'Asia/Manila' });
                    conn.update('system:auditaction', b, (u)=>{
                        conn.close();
                    });
                }else{
                    let b:any = {
                        action: action,
                        bean: bean,
                        service: BeanManager.SERVICE_NAMESPACE,
                        user: userName,
                        props: props,
                        count: 1,
                        tat: tat
                    }
                    conn.create('system:auditaction', b, (c)=>{
                        conn.close();
                    });
                }
            })
        }catch(e){
            console.log(e);
        }
    }

    async processRequest(params: any, query: any, body: any, headers: any, res: any): Promise<Object | StreamableFile> {
        console.log('processRequest');

        let startStamp = (new Date()).getTime();
        if(!DBService.getModelVersions().hasOwnProperty(params.version)){
            // support for legacy callers
            params.id = params.bean;
            params.bean = params.action;
            params.action = params.version;
            params.version = 'v0';
        }
        let { version, action, bean, id } = params;

        if(params && params.action && 
            (this.publicActions.hasOwnProperty(params.action) ||
             this.actions.hasOwnProperty(params.action))
        ){
            return new Promise<Object>((resolve, reject) => {
                DBService.connect(version, (pc) => {
                    if (pc.success) {
                        let conn: DBService = <DBService>pc.result;
                        let data: any = undefined;
                        let hasData = false;
                        if(headers && query && !headers.hasOwnProperty(this.header_api_access_key) && query.hasOwnProperty(this.header_api_access_key)){
                            headers[this.header_api_access_key] = query[this.header_api_access_key];
                        }
                        try {
                            if (body && body.hasOwnProperty('data')) {
                                data = JSON.parse(body.data);
                                hasData = true;
                            } else {
                                data = body;
                            }
                        } catch (e) {
                        }
                        if (action == 'batch') {
                            try {
                                let cIndex = -1;
                                let results:any = [];
                                let lastUser = {};
                                let fn = () => {
                                    cIndex++;
                                    if (cIndex >= data.length) {
                                        let endStamp = (new Date()).getTime();
                                        resolve({ 'success': true, 'message': 'batch.success', result: results });
                                        this.auditAction(conn, action, bean, data, id, lastUser, endStamp-startStamp);
                                        return;
                                    }
                                    let b = data[cIndex];
                                    if (!b.hasOwnProperty('id')) {
                                        b.id = '';
                                    } else if (!b.hasOwnProperty('data')) {
                                        b.data = {};
                                    }
                                    this.executeRequest(conn, version, b.action, b.bean, b.data, b.id, headers, body, BeanManager.mode.BATCH, (p:any, user) => {
                                        p.key = b.key;
                                        lastUser = user;
                                        results.push(p);
                                        fn();
                                    });
                                };
                                fn();
                            } catch (e) {
                                resolve({ 'success': false, 'message': 'access.denied' });
                                conn.close();
                                return;
                            }
                        } else {
                            let auditData = {...data};                            
                            this.executeRequest(conn, version, action, bean, data, id, headers, body, BeanManager.mode.REQUEST, (p, user) => {
                                let endStamp = (new Date()).getTime();
                                if(p.hasOwnProperty('buffer')){
                                    res.set({
                                        'Content-Type': p.contentType,
                                        'Content-Disposition': p.contentDisposition
                                    });
                                    resolve(new StreamableFile(p.buffer));
				                    this.auditAction(conn, action, bean, auditData, id, user, endStamp-startStamp);
                                }else if(p.hasOwnProperty('fileStream')){
                                    res.set({
                                        'Content-Type': p.contentType,
                                        'Content-Disposition': p.contentDisposition
                                    });
                                    p.fileStream.stream.pipe(res);
                                    p.fileStream.proceed(p.fileStream.stream, ()=>{
                                        p.fileStream.stream.end();
					                    this.auditAction(conn, action, bean, auditData, id, user, endStamp-startStamp);
                                    });
                                }else{
                                    resolve(p);
                                    this.auditAction(conn, action, bean, auditData, id, user, endStamp-startStamp);                              
                                }
                            });
                        }
                    } else {
                        console.log('api.failed', pc);
                        resolve({ 'success': false, 'message': 'api.failed' });
                    }
                });
            });
        }else{
            return new Promise<Object>((resolve, reject) => {
                resolve({ 'success': false, 'message': 'api.failed' });
            });
        }
    }

    getControl(){
        return {
            execute: (control: any, user: any, conn: any, action: string, bean: string, data: any, id: string, body: any, batchMode: boolean, callback: Function) => {
                let adata = { action: action, bean: bean, role: user.role, service: BeanManager.SERVICE_NAMESPACE, version: user.version };
                if(bean==undefined){
                    adata.bean = '';
                }
                conn.query('has-access', adata, (pa:any) => {
                    if (pa.success && pa.result.length > 0) {
                        this.performRequest(control, user, conn, action, bean, data, id, body, batchMode, callback);
                    } else {
                        callback({ 'success': false, 'message': 'access.denied' });
                    }
                });
            }
        }
    }

    performRequest(control: any, user: any, conn: any, action: string, bean: string, data: any, id: string, body: any, batchMode: boolean, callback: Function) {
        console.log('perform request');

        try {
            let files:any = [];
            for(let i in body){
                if(body[i] && body[i].hasOwnProperty('buffer')){
                    body[i].fieldname = i;
                    files.push(body[i]);
                }
            }
            let postback = (p) => {
                if (this.handlers.hasOwnProperty(bean) && this.handlers[bean].hasAfter(action, bean)) {
                    this.handlers[bean].getAfter(action, bean)(control, user, conn, bean, data, id, files, p, callback);
                } else if (this.handlers['*'].hasAfter(action, bean)) {
                    this.handlers['*'].getAfter(action, bean)(control, user, conn, bean, data, id, files, p, callback);
                } else {
                    callback(p);
                }
            }

            let flowback = () => {
                this.beanService[action](control, user, conn, bean, data, id, files, (p) => {
                    postback(p);
                });                        
            }                    

            if(this.handlers.hasOwnProperty(bean) && this.handlers[bean].hasBefore(action, bean)){
                this.handlers[bean].getBefore(action, bean)(control, user, conn, bean, data, id, files, flowback, callback);
            }else if(this.handlers['*'].hasBefore(action, bean)){
                this.handlers['*'].getBefore(action, bean)(control, user, conn, bean, data, id, files, flowback, callback);
            }else{
                flowback();
            }

        } catch (e) {
            console.log('error', action, bean, e);
            callback({ 'success': false, 'message': 'access.denied' });
        }
    }

    async executeRequest(conn: any, version:string, action: string, bean: string, data: any, id: string, headers: any, body: any, batchMode: boolean, callback: Function) {
        console.log('execute request');

        this.isAllowed(conn, version, action, bean, headers, (pa) => {
            if (pa.success) {
                let control = this.getControl();
                pa.user.version = version;
                this.performRequest(control, pa.user, conn, action, bean, data, id, body, batchMode, (p)=>{
                    callback(p, pa.user);
                });
            } else {
                callback({ 'success': false, 'message': 'access.denied' });
            }
        });        
    }

}
