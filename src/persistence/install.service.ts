
import * as fs from 'fs';
import { format } from 'date-fns-tz';

export class InstallService {

    constructor() {

    }

    public static start(db:any) {
        let models = db.getModels();
        let indexes = JSON.parse(fs.readFileSync('./data/index-patches.json','utf-8'));
        for(var i in models){
            InstallService.preProcess(db, i, (m)=>{
                if(fs.existsSync('./data/'+m+'.json')){
                    let data = JSON.parse(fs.readFileSync('./data/'+m+'.json','utf-8'));
                    InstallService.process(db, data, m, models[m].schemaFn());
                }
            });
            console.log('checking model:', i, db.getModelName(i));
            InstallService.preIndexProcess(db, db.getModelName(i), (m)=>{
                InstallService.processIndex(db, m, indexes[m]);
            });   
        }   
    }

    public static preProcess(db:any, modelName:string, callback:Function) {
        
        const cfgModels = JSON.parse(fs.readFileSync('./data/patches.json','utf8'));

        if (cfgModels.hasOwnProperty(modelName)) {
            var modelVersion = cfgModels[modelName];

            db.search('system:model', {"modelName": modelName}, (p) =>{
                let now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", { timeZone: 'Asia/Manila' });

                if(p.success && p.result.length>0) {
                    let xModel = p.result[0]; 

                    if (modelVersion > xModel.modelVersion) {
                        xModel.modelVersion = modelVersion;
                        xModel.updatedDate = now;
                        db.update('system:model', xModel, (xp)=>{
                            if(xp.success){
                                db.removeAll(modelName, {},(pda)=>{
                                    console.log(pda);
                                    callback(modelName);
                                });
                            }else{
                                callback(modelName);
                                console.log(xp);
                            }
                        });
                    }else{
                        // console.log('no version updates for ', modelName, modelVersion, xModel.modelVersion);
                        //do not return as this model has no updates
                    }
                } else {
                    console.log ("creating model patch:", modelName, modelVersion );
                    //callback(modelName);
                    db.create('system:model', {
                        "modelName": modelName,
                        "modelVersion": modelVersion,
                        "createdBy": "system",
                        "createdDate": now,
                        "updatedBy": "system",
                        "updatedDate": now
                    }, (p) => {
                        if(p.success){
                            callback(modelName);
                        }else{
                            callback(modelName);
                            console.log("failed:", modelName);
                        }
                        
                    });
                }
            });
        } else {
            // console.log("unpatched: ", modelName );
            callback(modelName);
        }
    }

    public static preIndexProcess(db:any, modelName:string, callback:Function) {
        
        const cfgModels = JSON.parse(fs.readFileSync('./data/index-patches.json','utf8'));

        if (cfgModels.hasOwnProperty(modelName)) {
            var modelVersion = cfgModels[modelName].version;

            db.search('system:index', {"modelName": modelName}, (p) =>{
                let now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", { timeZone: 'Asia/Manila' });

                if(p.success && p.result.length>0) {
                    let xModel = p.result[0]; 

                    if (modelVersion > xModel.modelVersion) {
                        xModel.modelVersion = modelVersion;
                        xModel.updatedDate = now;
                        db.update('system:index', xModel, (xp)=>{
                            callback(modelName);
                        });
                    }else{
                        callback(modelName);
                    }
                } else {
                    db.create('system:index', {
                        "modelName": modelName,
                        "modelVersion": modelVersion,
                        "createdBy": "system",
                        "createdDate": now,
                        "updatedBy": "system",
                        "updatedDate": now
                    }, (p) => {
                        if(p.success){
                            callback(modelName);
                        }else{
                            callback(modelName);
                            console.log("failed:", modelName);
                        }
                        
                    });
                }
            });
        } else {
            callback(modelName);
        }
    }    

    public static process(db:any, data:any, type: string, model: any){
        let i = -1;
        let startStamp = (new Date()).getTime();
        console.log('Processing', type, data.length);
        let fn = ()=>{
            if(i>=data.length){
                let endStamp = (new Date()).getTime();
                console.log('Request Turnaround Time ' + type, (endStamp-startStamp)/1000 + ' (s)');
                return;
            }
            i++;
            let record:any = {};
            let hit = 0;
            for(let p in model.properties){
                let prop = model.properties[p];
                if(data[i][prop.description]){
                    if(prop.type=='boolean'){
                        record[p] = data[i][prop.description];
                    }else{
                        record[p] = data[i][prop.description]+'';
                    }
                    hit++;
                }
            }
            if(hit>0){
                db.create(type, record, (t)=>{
                    if(!t.success){
                        console.log(type, t, record);
                    }
                    fn();
                })
            }else{
                fn();
            }
        }
        fn();
    }

    public static processIndex(db:any, type: string, model: any){
        
        if(model){
            if(db.modelRefs.hasOwnProperty(type) && db.getModel(db.modelRefs[type]).external){
                return;
            }
            db.db.collection(db.envProp('NAMESPACE')+':'+type).indexes()
            .then((result)=>{
                let indices:any = {};
                let current:any = {};
                for(let i=0;i<result.length;i++){
                    let n:string = '';
                    for(let k in result[i].key){
                        n += k+'_';
                    }
                    indices[n] = true;
                    current[n] = {
                        index: result[i],
                        found: false
                    };
                }
                
                for(let i=0;i<model.indexes.length;i++){
                    let n:string = '';
                    for(let k in model.indexes[i]){
                        n += k+'_';
                    }
                    // if(!indices.hasOwnProperty(n+'_type_')){
                    //     db.db.collection(db.envProp('NAMESPACE')+':'+type).createIndex({
                    //         ...model.indexes[i],
                    //         _type: 1
                    //     }, {
                    //     }, (ierr, iresult) => {
                    //         if (ierr) {
                    //             console.log('Index Result', ierr, iresult);
                    //         }
                    //     })
                    // }else{
                    //     try{
                    //         current[n].found = true;
                    //     }catch(err){
                    //         console.log('missing ', n, err);
                    //     }
                    // }
                    if(!indices.hasOwnProperty(n)){                
                        db.db.collection(db.envProp('NAMESPACE')+':'+type).createIndex({
                            ...model.indexes[i]
                        }, {
                        }, (ierr, iresult) => {
                            if (ierr) {
                                console.log('Index Result', ierr, iresult);
                            }
                        })
                    }else{
                        try{
                            current[n].found = true;
                        }catch(err){
                            console.log('missing ', n, err);
                        }
                    }
                }

                for(let i in current){
                    if(!current[i].found){
                        if(current[i] && current[i].index && current[i].index.name && current[i].index.name.indexOf('_id_')==-1){
                            console.log('Marked for deletion', current[i]);
                            db.db.collection(db.envProp('NAMESPACE')+':'+type).dropIndex(current[i].index.key, (err, result) => {
                                if (err){
                                    console.log('Failed to drop index', err, current[i]);
                                }else{
                                    console.log('Index dropped successfully', current[i]);
                                }
                            });
                        }
                    }
                }
            })
            .catch((err)=>{
                console.log('Index Result', err);
            })
        }
    }
}