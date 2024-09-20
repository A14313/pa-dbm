import { Injectable } from '@nestjs/common';
import { DBService } from '../persistence/db.service';
import { SwaggerHelper } from './helpers/swagger.helper';
import { PostmanHelper } from './helpers/postman.helper';
import { LoginHelper } from './helpers/login.helper';
import { VerifyHelper } from './helpers/verify.helper';
import { RefreshHelper } from './helpers/refresh.helper';
import { ImportHelper } from './helpers/import.helper';
import { ExportHelper } from './helpers/export.helper';
import { ExtractHelper } from './helpers/extract.helper';
import { format } from 'date-fns-tz';

@Injectable()
export class BeanService {


    excludeBeans: Object = {
        'system:settings': 'system:settings',
        'has-connection': 'has-connection',
        'has-access': 'has-access',
        'bean-access': 'bean-access'
    };

    excludeActions: Object = {
    };    
    
    allowedKeys: Object = {
        '$columns':true,
        '$paging': true,
        '$sorting': true,
        '$q': true,
        '$qa': true,
        '$exact': true,
        '$populate': true,
        '$debug': true,
        '$group': true
    };

    constructor() {
    }

    sanitize(m: any){
        let prefix = '$';
        for (let i in m) {
            if (i.indexOf(prefix)==0 && !this.allowedKeys.hasOwnProperty(i)) {
                delete m[i];
            } else {
                if (Array.isArray(m[i])) {
                    this.sanitize(m[i]);
                } else if (typeof m[i] == 'object') {
                    this.sanitize(m[i]);
                }
            }
        }
    }    

    status(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        callback({success:true, message:'status.success', now:''+new Date()});
    }    

    login(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        LoginHelper.login(this, control, user, db, bean, data, id, files, callback);
    }

    verify(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        VerifyHelper.verify(this, control, user, db, bean, data, id, files, callback);
    }

    refresh(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        RefreshHelper.refresh(this, control, user, db, bean, data, id, files, callback);
    }

    get(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        db.get(bean, id, (p) => {
            callback(p);
        });
    }

    find(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        db.find(bean, id, (p) => {
            callback(p);
        });
    }

    search(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        if (data) {
            this.sanitize(data);
            db.search(bean, data, (p) => {
                callback(p);
            });
        } else {
            callback({ success: false, message: 'search.failed' });
        }
    }

    query(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        if (data) {
            this.sanitize(data);
            db.query(bean, data, (p) => {
                callback(p);
            });
        } else {
            callback({ success: false, message: 'query.failed' });
        }
    }

    import(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        ImportHelper.import(this, control, user, db, bean, data, id, files, callback);
    }  
    
    extract(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        ExtractHelper.extract(this, control, user, db, bean, data, id, files, callback);
    }

    export(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        ExportHelper.export(this, control, user, db, bean, data, id, files, callback);
    }    

    create(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        if (data) {
            this.sanitize(data);
            data['createdBy'] = user.username;
            data['createdDate'] = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", { timeZone: 'Asia/Manila' });
            data['updatedBy'] = user.username;
            data['updatedDate'] = data['createdDate'];
            let model:any = db.getModel(bean);
            let vo:any = {};
            for (let i in model.schema.properties) {
                if(data.hasOwnProperty(i)){
                    vo[i] = data[i];
                }
            }
            db.create(bean, vo, (p) => {
                callback(p);
            });
        } else {
            callback({ success: false, message: 'create.failed' });
        }
        
    }

    update(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        if (data) {
            this.sanitize(data);
            delete data['createdBy'];
            delete data['createdDate'];
            data['updatedBy'] = user.username;
            data['updatedDate'] = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", { timeZone: 'Asia/Manila' });
            if(!data.hasOwnProperty('id')){
                callback({ success: false, message: 'update.failed' });
                return;
            }
            db.find(bean, data.id, (pb) => {
                if (pb.success && pb.result.length > 0) {
                    let vo: any = {};
                    let model:any = db.getModel(bean);
                    for (let i in model.schema.properties) {
                        if (data.hasOwnProperty(i)) {
                            vo[i] = data[i];
                        } else {
                            vo[i] = pb.result[0][i];
                        }
                    }
                    db.update(bean, vo, (p) => {
                        callback(p);
                    });
                } else {
                    callback({ success: false, message: 'update.failed' });
                }
            })
        } else {
            callback({ success: false, message: 'update.failed' });
        }
    }

    remove(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        db.remove(bean, id, (p) => {
            callback(p);
        });
    }

    schema(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        SwaggerHelper.schema(this, control, user, db, bean, data, id, files, callback);
    }

    meta(control:any, user: any, db: DBService, bean: any, data: any, id: string, files:any, callback: Function) {
        PostmanHelper.meta(this, control, user, db, bean, data, id, files, callback);
    }    
}
