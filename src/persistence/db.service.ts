import { v4 as uuidv4 } from 'uuid';
import { Validator } from 'jsonschema';
import { DBModelV0 } from './v0/db.model';
import { DBMonitor } from './db.monitor';

import { MongoClient } from 'mongodb';
import * as dfns from 'date-fns';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export class DBService {

    static ENCRYPTION_KEY: string;
    static CONNECTION_STR: string;
    static ENCRYPTION_ALGORITHM: string;
    static ENCRYPTION_IV_LENGTH: number;

    static modelVersions: Object = {
        v0: DBModelV0
    }

    db: any;
    client: any;

    collections: Object = {};

    modelNames: Object = {};
    modelRefs: Object = {};
    storedModels: Object = {};
    storedModelFields: Object = {};
    storedQueries: Object = {};
    storedQueryFields: Object = {};
    actualModels: Object = {};
    storedTables: Object = {};

    tmpQuery: string = '_q';
    tmpCount: string = '_c';

    sortDir: Object = {
        'ASC': 1,
        'DESC': -1,
        'asc': 1,
        'desc': -1
    };

    excludeModels: Object = {};

    maxResultCount: number = 1000;
    maxLookupLevel: number = 1;
    isResultRestricted: boolean = true;

    constructor() {
        console.log('db constructor');
        let e: any = process['e' + 'nv'];
        if (this.envProp('AZURE_CLIENT_ID_FILE') && !e['AZURE_CLIENT_ID']) {
            e['AZURE_CLIENT_ID'] = (fs.readFileSync(this.envProp('AZURE_CLIENT_ID_FILE'), 'utf8') + '').trim();
            e['AZURE_CLIENT_SECRET'] = (fs.readFileSync(this.envProp('AZURE_CLIENT_SECRET_FILE'), 'utf8') + '').trim();
            e['AZURE_TENANT_ID'] = (fs.readFileSync(this.envProp('AZURE_TENANT_ID_FILE'), 'utf8') + '').trim();
        }

        if (e['MAX_RESULT_COUNT']) {
            let val: any = e['MAX_RESULT_COUNT'];
            this.maxResultCount = val * 1;
        }

        if (!DBService.ENCRYPTION_KEY) {
            DBService.ENCRYPTION_KEY = this.getProp('ENCRYPTION_KEY');
            DBService.ENCRYPTION_ALGORITHM = this.getProp('ENCRYPTION_ALGORITHM');
            DBService.ENCRYPTION_IV_LENGTH = Number.parseInt(this.getProp('ENCRYPTION_IV_LENGTH'));
            DBService.getVaultKey((p) => {
                if (p.success) {
                    console.log('Encryption from Azure Vault set');
                }
            });
        }
    }

    restrictResults(flag: boolean) {
        this.isResultRestricted = flag;
    }

    public static getVaultKey(cb: Function) {
        // console.log('connecting to azure vault');
        // let e: any = process['e' + 'nv'];
        // let keyVaultName = e["COM_AZURE_KEYVAULTNAME"];
        // let url = `https://${keyVaultName}.vault.azure.net`;
        // let credential = new DefaultAzureCredential();
        // let client: any = new SecretClient(url, credential);
        // client['get' + 'Se' + 'cret'](e["AZURE_CONN_STR"]).then((secret) => {
        //     DBService.CONNECTION_STR = secret.value;
        //     client['get' + 'Se' + 'cret'](e["AZURE_KEY_NAME"]).then((secret) => {
        //         DBService.ENCRYPTION_KEY = secret.value;
        //         cb({ success: true });
        //     }).catch((e) => {
        //         cb({ success: false });
        //         console.log(e);
        //     });
        // }).catch((e) => {
        //     cb({ success: false });
        //     console.log(e);
        // });
        console.log('connecting to azure vault');
        let keyVaultName = process.env["COM_AZURE_KEYVAULTNAME"];
        let url = `https://${keyVaultName}.vault.azure.net`;
        let credential = new DefaultAzureCredential();
        let client = new SecretClient(url, credential);

        client.getSecret(process.env["AZURE_CONN_STR"]).then((secret) => {
            DBService.CONNECTION_STR = secret.value;
            client.getSecret(process.env["AZURE_KEY_NAME"]).then((secret) => {
                DBService.ENCRYPTION_KEY = secret.value;
                cb({ success: true });
            }).catch((e) => {
                cb({ success: false });
                console.log(e);
            });
        }).catch((e) => {
            cb({ success: false });
            console.log(e);
        });
    }

    public static connect(version: string, cb: Function) {
        let scope = new DBService();
        let retry = 100;
        let fn = () => {
            try {

                let url = '';
                if (DBService.CONNECTION_STR) {
                    url = DBService.CONNECTION_STR;
                    //DO NOT FORGET TO REMOVE OVERRIDE!!!!
                    // url = scope.envProp('DB_PROTOCOL') + '://' +
                    //     encodeURIComponent(scope.envProp('DB_USERNAME')) + ':' +
                    //     encodeURIComponent(scope.envProp('DB_PASSWORD')) + '@' +
                    //     scope.envProp('DB_HOSTNAME') + '/?retryWrites=true&writeConcern=majority';
                } else if (scope.getProp('DB_HOSTNAME')) {
                    url = scope.envProp('DB_PROTOCOL') + '://' +
                        encodeURIComponent(scope.getProp('DB_USERNAME')) + ':' +
                        encodeURIComponent(scope.getProp('DB_PASSWORD')) + '@' +
                        scope.getProp('DB_HOSTNAME') + '/?retryWrites=true&writeConcern=majority';
                } else {
                    setTimeout(fn, 5000);
                    return;
                }

                let client = new MongoClient(url);
                client.connect().then((ret) => {
                    scope.client = client;
                    let db: any = client.db(scope.envProp('DB_SCHEMA'));
                    db.listCollections().toArray((err: any, collections: any) => {
                        if (err) {
                            console.log('collections error', err);
                            return;
                        }
                        DBMonitor.getInstance().addClient(client);
                        try {
                            for (let i = 0; i < collections.length; i++) {
                                let c = collections[i];
                                scope.collections[c.name] = c;
                            }
                            scope.db = db;
                            let dbmodel: any = scope.getModelVersion(version);
                            new dbmodel(scope);
                            cb({
                                success: true,
                                result: scope
                            });
                        } catch (e) {
                            cb({
                                success: false,
                                message: 'connection.failed',
                                result: e
                            });
                        }
                    });
                }).catch((err) => {
                    console.log('connecting error', err);
                    if (retry > 0) {
                        retry--;
                        setTimeout(fn, 5000);
                    } else {
                        cb({
                            success: false,
                            message: 'connection.failed',
                            result: err
                        });
                    }
                })

            } catch (e) {
                console.log('connecting error', e);
                if (retry > 0) {
                    retry--;
                    setTimeout(fn, 5000);
                } else {
                    cb({
                        success: false,
                        message: 'connection.failed'
                    });
                }
            }
        }
        fn();
    }

    getMonitor() {
        return DBMonitor.getInstance();
    }

    getProp(prop: string) {
        if (this.envProp(prop + '_FILE')) {
            return (fs['rea' + 'dFil' + 'eSync'](this.envProp(prop + '_FILE'), 'utf8') + '').trim();
        } else {
            return (this.envProp(prop) + '').trim();
        }
    }

    envProp(targetProperty: string): string {
        let e: any = process['e' + 'nv'];
        if (e.hasOwnProperty(targetProperty)) {
            return (process.env[targetProperty] + '').trim();
        } else {
            return undefined;
        }
    }

    getEn(): any {
        let e: any = process['e' + 'nv'];
        return e;
    }

    setExcludedModels(models: Object) {
        this.excludeModels = models
    }

    getModelName(type: string) {
        return this.modelNames[type];
    }

    storeModel(name: string, schema: Function, refs: Array<string>) {
        let scheme = schema();
        this.modelNames[name] = name;
        if (name && (name.indexOf('system:') == -1 && !this.excludeModels.hasOwnProperty(name))) {
            let fields = scheme.properties;
            let mapping: any = [];

            for (let i in fields) {
                mapping.push({
                    id: i,
                    name: fields[i].description,
                    type: fields[i].type,
                    lookup: fields[i]['$lookup'],
                    entry: fields[i].entry
                });
            }

            this.storedModelFields[name] = {
                name: scheme.id.substring(1, scheme.id.length),
                props: mapping
            };

            this.modelNames[name] = scheme.id.substring(1, scheme.id.length);
            this.modelRefs[this.modelNames[name]] = name;
        }
        this.storedModels[name] = {
            schema: schema(),
            schemaFn: schema,
            external: false,
            refs
        };
        let cname = this.envProp('NAMESPACE') + ':' + this.modelNames[name];
        if (!this.collections.hasOwnProperty(cname)) {
            this.db.createCollection(cname, {
                autoIndexId: false
            }).then((collection: any) => {
                if (collection) {
                    this.collections[name] = this.db.collection(cname);
                    this.collections[name].createIndex({
                        id: 1,
                        _type: 1
                    }, {
                        unique: true
                    }, (ierr, iresult) => {
                        if (ierr) {
                            console.log('Index Result', ierr, iresult);
                        }
                    });
                    let sprops = this.storedModels[name].schema.properties;
                    for (let i in sprops) {
                        if (sprops[i].unique) {
                            this.collections[name].createIndex({
                                [i]: 1,
                                _type: 1
                            }, {
                                unique: true
                            }, (ierr, iresult) => {
                                if (ierr) {
                                    console.log('Index Result', ierr, iresult);
                                }
                            });
                        }
                    }
                } else {
                    console.log('collection creation error', collection);
                }
            }).catch((err) => {
                if (err && err.hasOwnProperty('codeName') && err.codeName != 'NamespaceExists') {
                    console.log('collection creation error', err);
                }
            });
        }
    }

    storeReferenceModel(sibling: string, namespace: string, service: string, name: string, schema: Function, refs: Array<string>) {
        let scheme = schema();
        this.modelNames[name] = name;
        if (name && (name.indexOf('system:') == -1 && !this.excludeModels.hasOwnProperty(name))) {
            let fields = scheme.properties;
            let mapping: any = [];

            for (let i in fields) {
                mapping.push({
                    id: i,
                    name: fields[i].description,
                    type: fields[i].type,
                    lookup: fields[i]['$lookup'],
                    entry: fields[i].entry
                });
            }

            this.storedModelFields[name] = {
                name: scheme.id.substring(1, scheme.id.length),
                props: mapping
            };
            this.modelNames[name] = scheme.id.substring(1, scheme.id.length);
            this.modelRefs[this.modelNames[name]] = name;
        }
        this.storedModels[name] = {
            schema: schema(),
            schemaFn: schema,
            external: true,
            sibling,
            namespace,
            service,
            refs
        };
    }

    storeQuery(name: string, collection: string, schema: Function, pipeline: Function, resultSchema: Function, refs: Array<string>) {
        if (name && name.indexOf('system:') == -1) {
            let scheme = schema();
            let fields = scheme.properties;
            let mapping: any = [];

            for (let i in fields) {
                mapping.push({
                    id: i,
                    name: fields[i].description,
                    lookup: fields[i]['$lookup']
                });
            }

            this.storedQueryFields[name] = {
                name: scheme.id.substring(1, scheme.id.length),
                props: mapping
            };
        }
        this.storedQueries[name] = {
            collection: collection,
            schema: schema(),
            schemaFn: schema,
            pipeline: pipeline,
            refs
        };
        if (resultSchema) {
            this.storedQueries[name].resultSchema = resultSchema();
            this.storedQueries[name].resultSchemaFn = resultSchema;
        }
    }

    storeReferenceQuery(sibling: string, namespace: string, service: string, name: string, collection: string, schema: Function, pipeline: Function, resultSchema: Function, refs: Array<string>) {
        if (name && name.indexOf('system:') == -1) {
            let scheme = schema();
            let fields = scheme.properties;
            let mapping: any = [];

            for (let i in fields) {
                mapping.push({
                    id: i,
                    name: fields[i].description,
                    lookup: fields[i]['$lookup']
                });
            }

            this.storedQueryFields[name] = {
                name: scheme.id.substring(1, scheme.id.length),
                props: mapping
            };
        }
        this.storedQueries[name] = {
            collection: collection,
            schema: schema(),
            schemaFn: schema,
            pipeline: pipeline,
            external: true,
            sibling,
            namespace,
            service,
            refs
        };
        if (resultSchema) {
            this.storedQueries[name].resultSchema = resultSchema();
            this.storedQueries[name].resultSchemaFn = resultSchema;
        }
    }

    generateKey(): string {
        return dfns.format(new Date(), 'yyyyww') + (uuidv4().split('-').join(''));
    }

    encryptPath(obj: any, path: string) {
        try {
            const params: string[] = path
                .split(/[.\[\]]+/g)
                .filter(Boolean)
                .map((i: string) => i.replace(/^["'](.*)["']$/g, "$1"));
            let i = 0
            for (; i < params.length - 1; i++) {
                obj = obj[params[i]];
            }
            if (obj && obj[params[i]]) {
                obj[params[i]] = this.encrypt(obj[params[i]]);
            }
        } catch (e) {
            console.log(path, e);
        }
        return obj;
    }

    decryptPath(obj: any, path: string) {
        try {
            const params: string[] = path
                .split(/[.\[\]]+/g)
                .filter(Boolean)
                .map((i: string) => i.replace(/^["'](.*)["']$/g, "$1"));
            let i = 0;
            let parent: any = undefined;
            for (; i < params.length - 1; i++) {
                parent = obj;
                obj = obj[params[i]];
            }

            obj[params[i]] = this.decrypt(obj[params[i]]);

            if (this.isNumeric(params[i]) && i > 0) {
                if (parent.hasOwnProperty(params[i - 1] + '_filter')) {
                    delete parent[params[i - 1] + '_filter'];
                }
            } else {
                if (obj.hasOwnProperty(params[i] + '_filter')) {
                    delete obj[params[i] + '_filter'];
                }
            }
        } catch (e) {
            let o: any = {
                path: path,
                err: e
            };
            console.log(o);
        }
        return obj;
    }

    hashPath(obj: any, path: string) {
        try {
            const params: string[] = path
                .split(/[.\[\]]+/g)
                .filter(Boolean)
                .map((i: string) => i.replace(/^["'](.*)["']$/g, "$1"));
            let i = 0;
            let parent: any = undefined;
            for (; i < params.length - 1; i++) {
                parent = obj;
                obj = obj[params[i]];
            }
            if (obj[params[i]]) {
                if (this.isNumeric(params[i]) && i > 0) {
                    if (parent.hasOwnProperty(params[i - 1] + '_filter') == false) {
                        parent[params[i - 1] + '_filter'] = [];
                    }
                    parent[params[i - 1] + '_filter'][params[i]] = this.hash(obj[params[i]]);
                } else {
                    obj[params[i] + '_filter'] = this.hash(obj[params[i]]);
                }
            }
        } catch (e) {
            console.log('hash', path, e);
        }
    }

    hashPathAndEncrypt(obj: any, path: string) {
        try {
            const params: string[] = path
                .split(/[.\[\]]+/g)
                .filter(Boolean)
                .map((i: string) => i.replace(/^["'](.*)["']$/g, "$1"));
            let i = 0;
            let parent: any = undefined;
            for (; i < params.length - 1; i++) {
                parent = obj;
                obj = obj[params[i]];
            }
            if (obj[params[i]]) {
                if (this.isNumeric(params[i]) && i > 0) {
                    if (parent.hasOwnProperty(params[i - 1] + '_filter') == false) {
                        parent[params[i - 1] + '_filter'] = [];
                    }
                    parent[params[i - 1] + '_filter'][params[i]] = this.hash(obj[params[i]]);
                } else {
                    obj[params[i] + '_filter'] = this.hash(obj[params[i]]);
                }
                obj[params[i]] = this.encrypt(obj[params[i]]);
            }
        } catch (e) {
            console.log('hash', path, e);
        }
    }

    hashPathAndRemove(obj: any, path: string) {
        try {
            let oobj = obj;
            const params: string[] = path
                .split(/[.\[\]]+/g)
                .filter(Boolean)
                .map((i: string) => i.replace(/^["'](.*)["']$/g, "$1"));
            let i = 0
            let parent: any = undefined;
            for (; i < params.length - 1; i++) {
                parent = obj;
                obj = obj[params[i]];
            }
            if (obj[params[i]]) {
                if (this.isNumeric(params[i]) && i > 0) {
                    if (parent.hasOwnProperty(params[i - 1] + '_filter') == false) {
                        parent[params[i - 1] + '_filter'] = [];
                    }
                    parent[params[i - 1] + '_filter'][params[i]] = this.hash(obj[params[i]]);
                    if ((parseInt(params[i])) >= parent[params[i - 1]].length - 1) {
                        delete parent[params[i - 1]];
                    }
                } else {
                    obj[params[i] + '_filter'] = this.hash(obj[params[i]]);
                    delete obj[params[i]];
                }
            }
        } catch (e) {
            console.log('hash', path, e);
        }
    }

    hashPaths(obj: any, paths: Array<string>, done: Function) {
        for (let i = 0; i < paths.length; i++) {
            this.hashPath(obj, paths[i]);
        }
    }

    hashPathsAndRemove(obj: any, paths: Array<string>) {
        for (let i = 0; i < paths.length; i++) {
            this.hashPathAndRemove(obj, paths[i]);
        }
    }

    hashPathsAndEncrypt(obj: any, paths: Array<string>) {
        for (let i = 0; i < paths.length; i++) {
            this.hashPathAndEncrypt(obj, paths[i]);
        }
    }

    encryptPaths(obj: any, paths: Array<string>) {
        for (let i = 0; i < paths.length; i++) {
            this.encryptPath(obj, paths[i]);
        }
    }

    decryptPaths(obj: any, paths: Array<string>) {
        for (let i = 0; i < paths.length; i++) {
            this.decryptPath(obj, paths[i]);
        }
    }

    validateModel(name: string, data: Object): Array<string> {
        let model = this.storedModels[name];
        if (!model.hasOwnProperty('validator')) {
            let validator: any = new Validator();
            validator.attributes.encrypted = (instance: any, schema: any, options: any, ctx: any) => {
                let prefix = 'instance.';
                let path = ctx.propertyPath.substring(ctx.propertyPath.indexOf(prefix) + prefix.length, ctx.propertyPath.length);
                if (options && options.hasOwnProperty('forEncryption') == false) {
                    options['forEncryption'] = [];
                }
                options['forEncryption'].push(path);
                return true;
            }
            for (let i in this.storedModels) {
                if (i != name) {
                    let ref = this.storedModels[i];
                    validator.addSchema(ref.schema, ref.schema.id);
                }
            }
            model.validator = validator;
        }
        let result = model.validator.validate(data, model.schema, { nestedErrors: true });
        return result;
    }

    validateQueryModel(name: string, data: Object): Array<string> {
        let query = this.storedQueries[name];
        if (!query.hasOwnProperty('queryModelValidator')) {
            let validator: any = new Validator();
            validator.attributes.encrypted = (instance: any, schema: any, options: any, ctx: any) => {
                let prefix = 'instance.';
                let path = ctx.propertyPath.substring(ctx.propertyPath.indexOf(prefix) + prefix.length, ctx.propertyPath.length);
                if (options && options.hasOwnProperty('forEncryption') == false) {
                    options['forEncryption'] = [];
                }
                options['forEncryption'].push(path);
                return true;
            }
            for (let i in this.storedModels) {
                if (i != name) {
                    let ref = this.storedModels[i];
                    validator.addSchema(ref.schema, ref.schema.id);
                }
            }
            query.queryModelValidator = validator;
        }
        let result = query.queryModelValidator.validate(data, query.resultSchema, { nestedErrors: true });
        return result;
    }


    validateQuery(name: string, data: Object): Array<string> {
        let query = this.storedQueries[name];
        if (!query.hasOwnProperty('validator')) {
            let validator: any = new Validator();
            validator.attributes.encrypted = (instance: any, schema: any, options: any, ctx: any) => {
                let prefix = 'instance.';
                let path = ctx.propertyPath.substring(ctx.propertyPath.indexOf(prefix) + prefix.length, ctx.propertyPath.length);
                if (options && options.hasOwnProperty('forEncryption') == false) {
                    options['forEncryption'] = [];
                }
                options['forEncryption'].push(path);
                return true;
            }
            query.validator = validator;
        }
        let result = query.validator.validate(data, query.schema, { nestedErrors: true });
        return result;
    }

    status(flag: boolean, message: string, result: any): Object {
        return {
            success: flag,
            message: message,
            result: result
        };
    }

    isNumeric(value) {
        return /^\d+$/.test(value);
    }

    hash(phrase: string) {
        return crypto.createHash("sha256").update(phrase + DBService.ENCRYPTION_KEY).digest("hex");
    }

    encrypt(phrase: string) {
        if (!phrase) {
            phrase = '';
        }
        let key = Buffer.from(DBService.ENCRYPTION_KEY, 'base64');
        let algorithm = DBService.ENCRYPTION_ALGORITHM;
        let iv_length = DBService.ENCRYPTION_IV_LENGTH;
        let iv = crypto.randomBytes(iv_length);
        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let message = Buffer.from(phrase);
        let encrypted = cipher.update(message.toString('binary'), 'binary', 'binary');
        encrypted += cipher.final('binary');
        let combined = Buffer.concat([iv, Buffer.from(encrypted, 'binary')]);
        return combined.toString('base64');
    }

    decrypt(secret: string) {
        try {
            if (secret) {
                let chunk = Buffer.from(secret, 'base64');
                let key = Buffer.from(DBService.ENCRYPTION_KEY, 'base64');
                let algorithm = DBService.ENCRYPTION_ALGORITHM;
                let iv_length = DBService.ENCRYPTION_IV_LENGTH;

                let iv = chunk.slice(0, iv_length);
                let decoded = chunk.slice(iv_length, chunk.length);
                let decipher = crypto.createDecipheriv(algorithm, key, iv);
                let decrypted = decipher.update(decoded.toString('binary'), 'binary', 'binary');
                decrypted += decipher.final();

                return decrypted.toString();
            } else {
                return secret;
            }
        } catch (e) {
            console.log('decrypting', secret, e);
            return secret;
        }

    }

    close() {
        let retries = 10;
        let fn = () => {
            if (retries < 0) return;
            retries--;
            try {
                if (this.client) {
                    this.client.close();
                }
            } catch (e) {
                try {
                    setTimeout(fn, 1000);
                } catch (ee) {
                }
            }
        }
        fn();
    }

    stripeIn(type: string, data: any) {
        let props = this.storedModels[type].schema.properties;
        for (let i in props) {
            if (props[i].hasOwnProperty('unique') && props[i].unique && data.hasOwnProperty(i) && data[i].indexOf(this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') == -1) {
                data[i] = (this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + data[i];
            }
        }
    }

    stripeOut(type: string, data: any) {
        let props = this.storedModels[type].schema.properties;
        for (let i in props) {
            if (props[i].hasOwnProperty('unique') && props[i].unique && data.hasOwnProperty(i)) {
                data[i] = data[i].substring((this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':').length, data[i].length);
            }
        }
    }

    stripeInQuery(type: string, data: any) {
        let props = this.storedQueries[type].schema.properties;
        for (let i in props) {
            if (props[i].hasOwnProperty('unique') && props[i].unique && data.hasOwnProperty(i) && data[i].indexOf(this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') == -1) {
                data[i] = (this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + data[i];
            }
        }
    }

    stripeOutQuery(type: string, data: any) {
        let props = this.storedQueries[type].schema.properties;
        for (let i in props) {
            if (props[i].hasOwnProperty('unique') && props[i].unique && data.hasOwnProperty(i)) {
                data[i] = data[i].substring((this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':').length, data[i].length);
            }
        }
    }

    remove(type: string, id: string, cb: Function) {
        let scope = this;
        let otype = type;
        if (type == undefined || (type + '').length <= 0 || id == undefined || (id + '').length <= 0) {
            cb(scope.status(false, 'remove.failed', type));
            return;
        }
        type = this.envProp('NAMESPACE') + ':' + this.modelNames[type];
        let props = this.storedModels[otype].schema.properties;
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && id && id.indexOf(this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') == -1) {
            id = (this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + id;
        }
        scope.db.collection(type).findOneAndDelete({ id: id, _type: type })
            .then((result) => {
                cb(scope.status(true, 'remove.success', {}));
            })
            .catch((err) => {
                cb(scope.status(false, 'remove.failed', err));
            });
    }

    removeAll(type: string, data: any, cb: Function) {
        console.log('Deleting many', type, data);
        let scope = this;
        let otype = type;
        type = this.envProp('NAMESPACE') + ':' + this.modelNames[type];
        data._type = type;
        let props = this.storedModels[otype].schema.properties;
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && data.hasOwnProperty('id') && data.id.indexOf(this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') == -1) {
            data.id = (this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + data.id;
        }

        scope.db.collection(type).deleteMany(data)
            .then((result) => {
                cb(scope.status(true, 'remove.success', {}));
            })
            .catch((err) => {
                cb(scope.status(false, 'remove.failed', err));
            });
    }

    find(type: string, id: string, cb: Function) {
        let otype = type;
        let scope = this;
        type = this.envProp('NAMESPACE') + ':' + this.modelNames[type];
        let filter = { _type: type };
        if (id && id.trim() != '%' && id.trim() != '') {
            filter['id'] = id;
        }

        let props = this.storedModels[otype].schema.properties;
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && id && id.indexOf(this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') == -1) {
            id = (this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + id;
        }

        scope.db.collection(type).find(filter).toArray()
            .then((results) => {
                if (scope.isResultRestricted && results.length > scope.maxResultCount) {
                    cb(scope.status(false, 'find.result.exceeded', []));
                    return;
                }
                for (let i = 0; i < results.length; i++) {
                    let row = results[i];
                    let validation: any = scope.validateModel(otype, row);
                    if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
                        scope.decryptPaths(row, validation.options.forEncryption);
                    }
                    let props = scope.storedModels[otype].schema.properties;
                    if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && row.hasOwnProperty('id')) {
                        row.id = row.id.substring((scope.envProp('NAMESPACE') + ':' + scope.envProp('SERVICE_NAMESPACE') + ':').length, row.id.length);
                    }
                    scope.stripeOut(otype, row);
                }
                cb(scope.status(true, 'find.success', results));
            })
            .catch((err) => {
                cb(scope.status(false, 'find.failed', err));
            });
    }

    search(type: string, data: any, cb: Function) {
        let otype = type;
        let props = this.storedModels[otype].schema.properties;
        let model = this.storedModels[otype]
        let namespace = this.envProp('NAMESPACE');
        let service = this.envProp('SERVICE_NAMESPACE');
        if (model.external) {
            namespace = model.namespace;
        }
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && data.hasOwnProperty('id') && data.id.indexOf(this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') == -1) {
            data.id = (namespace + ':' + service + ':') + data.id;
        }

        this.stripeIn(otype, data);

        let paging: any = undefined;
        let sorting: any = undefined;
        let filter: any = undefined;
        let debug: any = undefined;
        let group: any = undefined;

        let total = 0;
        let populate: any = undefined;

        if (data.hasOwnProperty('$populate')) {
            populate = data['$populate'];
            delete data['$populate'];
        }

        if (data.hasOwnProperty('$paging')) {
            paging = data['$paging'];
            delete data['$paging'];
        }

        if (data.hasOwnProperty('$sorting')) {
            sorting = data['$sorting'];
            delete data['$sorting'];
        }

        let mode = 'or';
        if (data.hasOwnProperty('$q')) {
            filter = data['$q'];
            delete data['$q'];
        }

        if (data.hasOwnProperty('$qa')) {
            filter = data['$qa'];
            delete data['$qa'];
            mode = 'and';
        }

        if (data.hasOwnProperty('$debug')) {
            delete data['$debug'];
            debug = true;
        }

        if (data.hasOwnProperty('$group')) {
            group = data['$group'];
            delete data['$group'];
        }

        let validation: any = this.validateModel(type, data);
        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
            this.hashPathsAndRemove(data, validation.options.forEncryption);
        }

        if (model.external) {
            type = this.modelNames[type];
        }
        else {
            type = namespace + ':' + this.modelNames[type];
        }

        let scope = this;

        console.log("searchData:", data);

        if (model.external) {
            if (data.hasOwnProperty("_type")) {
                delete data._type;
            }
        }
        else {
            data._type = type;
        }

        console.log("========= searchProps:", props);
        console.log("========= searchFilter:", filter);
        if (filter && Array.isArray(filter)) {
            let ors: any = [];
            for (let i = 0; i < filter.length; i++) {
                let f: any = filter[i];
                if (
                    f.hasOwnProperty('field') &&
                    f.hasOwnProperty('value') &&
                    f.hasOwnProperty('op') && props.hasOwnProperty(f.field)
                ) {
                    if (
                        (props[f.field].hasOwnProperty('encrypted') && props[f.field].encrypted) ||
                        (props[f.field].hasOwnProperty('items') && props[f.field].items.hasOwnProperty('encrypted') && props[f.field].items.encrypted)
                    ) {
                        f.field = f.field + '_filter';
                        if (Array.isArray(f.value)) {
                            for (let fi = 0; fi < f.value.length; fi++) {
                                f.value[fi] = this.hash(f.value[fi]);
                            }
                        } else {
                            f.value = this.hash(f.value);
                        }
                    }
                    if (f.op == 'starts') {
                        ors.push({ [f.field]: new RegExp('^' + f.value, 'i') });
                    } else if (f.op == 'ends') {
                        ors.push({ [f.field]: new RegExp(f.value + '$', 'i') });
                    } else if (f.op == 'has') {
                        ors.push({ [f.field]: new RegExp(f.value, 'i') });
                    } else if (f.op == 'eq') {
                        ors.push({ [f.field]: f.value });
                    } else if (f.op == 'neq') {
                        ors.push({ [f.field]: { '$ne': f.value } });
                    } else if (f.op == 'in') {
                        ors.push({ [f.field]: { '$in': f.value } });
                    } else if (f.op == 'nin') {
                        ors.push({ [f.field]: { '$nin': f.value } });
                    } else if (f.op == 'all') {
                        ors.push({ [f.field]: { '$all': f.value } });
                    } else if (f.op == 'between' && Array.isArray(f.value) && f.value.length >= 2) {
                        let prop: any = props[f.field];
                        if (prop.hasOwnProperty('format') && prop.format.indexOf('date') != -1) {
                            ors.push({
                                [f.field]: {
                                    '$gte': new Date(f.value[0]),
                                    '$lte': new Date(f.value[1])
                                }
                            });
                        } else {
                            ors.push({
                                [f.field]: {
                                    '$gte': f.value[0],
                                    '$lte': f.value[1]
                                }
                            });
                        }
                    }
                }
            }

            console.log("========= searchORS:", ors);
            if (ors.length > 0) {
                if (mode == 'and') {
                    data['$and'] = ors;
                } else {
                    data['$or'] = ors;
                }
            }
        }

        let cursor: any = undefined;
        let pipeline: any = [
            {
                "$match": data
            }
        ];
        let missingTags: any = [];
        if (populate) {

            let buildPopulate: Function = (list: any, targetType: string, pipe: any, level: number) => {
                if (level >= scope.maxLookupLevel) return;
                let pr = scope.storedModels[targetType].schema.properties;
                for (let jc = 0; jc < list.length; jc++) {
                    let pc: any = list[jc];
                    if (!pc.hasOwnProperty('alt')) {
                        pc.alt = 0;
                    }

                    if (pr.hasOwnProperty(pc.to)) {

                        let targetModel: any = undefined;
                        let prt = pr[pc.to];
                        if (prt.type == 'array' && prt.hasOwnProperty('items')) {
                            let prt2: any = undefined;
                            if (pc.hasOwnProperty('alt') && Number.isInteger(pc['alt']) && prt.items.hasOwnProperty('oneOf') && (pc['alt'] >= 0 && pc['alt'] < prt.items.oneOf.length)) {
                                prt2 = prt.items.oneOf[parseInt(pc['alt'])];
                            } else {
                                prt2 = prt;
                            }
                            if (prt2.type == 'array' && prt2.hasOwnProperty('items') && prt2.items.hasOwnProperty('$ref')) {
                                targetModel = prt2.items['$ref'].substring(1, prt2.items['$ref'].length);
                            } else if (prt2.hasOwnProperty('$ref')) {
                                targetModel = prt2['$ref'].substring(1, prt2['$ref'].length);
                            }
                        } else if (prt.hasOwnProperty('$ref')) {
                            targetModel = prt['$ref'].substring(1, prt['$ref'].length);
                        } else if (prt.hasOwnProperty('oneOf') && prt.oneOf.length > 0) {
                            let prtIndex = 0;
                            if (pc.hasOwnProperty('alt') && Number.isInteger(pc['alt']) && (pc['alt'] >= 0 && pc['alt'] < prt.oneOf.length)) {
                                prtIndex = parseInt(pc['alt']);
                            }
                            let prt2 = prt.oneOf[prtIndex];
                            if (prt2.type == 'array' && prt2.hasOwnProperty('items') && prt2.items.hasOwnProperty('$ref')) {
                                targetModel = prt2.items['$ref'].substring(1, prt2.items['$ref'].length);
                            } else if (prt2.hasOwnProperty('$ref')) {
                                targetModel = prt2['$ref'].substring(1, prt2['$ref'].length);
                            }
                        }

                        if (targetModel) {
                            let step = {};
                            if (pc.hasOwnProperty('$populate') && scope.modelRefs.hasOwnProperty(targetModel)) {
                                step["$lookup"] = {
                                    "from": namespace + ':' + targetModel,
                                    "let": { [pc.from]: '$' + pc.from },
                                    "pipeline": [
                                        {
                                            "$match": {
                                                "$expr": {
                                                    "$and": [
                                                        { "$eq": ["$id", "$$" + pc.from] },
                                                        { "$eq": ["$_type", namespace + ':' + targetModel] }
                                                    ]
                                                }
                                            }
                                        }
                                    ],
                                    "as": pc.to
                                };
                                buildPopulate(pc['$populate'], scope.modelRefs[targetModel], step["$lookup"]["pipeline"], level + 1);
                            } else {
                                step["$lookup"] = {
                                    "from": namespace + ':' + targetModel,
                                    "localField": pc.from,
                                    "foreignField": "id",
                                    "as": pc.to
                                };
                            }
                            pipe.push(step);
                        } else {
                            missingTags.push(prt);
                            console.log('Unable to find the targetModel!', prt, pc);
                        }
                    }
                }
            }
            buildPopulate(populate, otype, pipeline, 0);
        }

        if (group) {
            let grouping: any = {
                _id: {

                }
            }
            for (let i in props) {
                if (group.hasOwnProperty(i)) {
                    if (group[i] == 'sum') {
                        grouping[i] = {
                            '$sum': '$' + i
                        }
                    } else if (group[i] == 'cnt') {
                        grouping[i] = {
                            '$count': '$' + i
                        }
                    } else if (group[i] == 'avg') {
                        grouping[i] = {
                            '$avt': '$' + i
                        }
                    } else if (group[i] == 'max') {
                        grouping[i] = {
                            '$max': '$' + i
                        }
                    } else if (group[i] == 'min') {
                        grouping[i] = {
                            '$min': '$' + i
                        }
                    } else {
                        grouping._id[i] = '$' + i;
                        grouping[i] = {
                            '$first': '$' + i
                        }
                    }
                }
            }
            grouping._id['_type'] = '$_type';
            pipeline.push({
                '$group': grouping
            });
        }

        let collection = scope.db.collection(type);

        if (model.external) {
            collection = scope.client.db(model.sibling).collection(this.modelNames[otype]);
            //collection = scope.client.db(model.sibling).collection(model.namespace + ':' + this.modelNames[otype])
        }
        if (populate || group) {
            cursor = collection.aggregate(pipeline);
        } else {
            console.log("==============  findData:", data);
            cursor = collection.find(data);
        }

        if (sorting) {
            let sk: any = {};
            if (Array.isArray(sorting)) {
                for (let i = 0; i < sorting.length; i++) {
                    sk[sorting[i].sort] = this.sortDir[sorting[i].dir];
                }
            } else if (sorting.hasOwnProperty('sort') && sorting.hasOwnProperty('dir')) {
                sk[sorting.sort] = this.sortDir[sorting.dir];
            } else {
                for (let s in sorting) {
                    sk[s] = this.sortDir[sorting[s]];
                }
            }
            cursor = cursor.sort(sk);
        }

        let queryFn = () => {
            cursor.toArray()
                .then((results) => {
                    for (let i = 0; i < results.length; i++) {
                        let row = results[i];
                        let validation: any = scope.validateModel(otype, row);
                        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
                            scope.decryptPaths(row, validation.options.forEncryption);
                        }
                        let props = scope.storedModels[otype].schema.properties;
                        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && row.hasOwnProperty('id')) {
                            row.id = row.id.substring((namespace + ':' + scope.envProp('SERVICE_NAMESPACE') + ':').length, row.id.length);
                        }
                        scope.stripeOut(otype, row);
                    }
                    if (paging) {
                        if (total == 0) {
                            total = results.length;
                        }
                        if (scope.isResultRestricted && paging.limit > scope.maxResultCount) {
                            cb(scope.status(false, 'paging.search.result.exceeded', []));
                            return;
                        }
                        let packet: any = {
                            total: total,
                            records: results
                        };
                        if (debug) {
                            packet.debug = {
                                pipeline: pipeline,
                                missing: missingTags
                            };
                        }
                        cb(scope.status(true, 'search.success', packet));
                    } else {
                        if (scope.isResultRestricted && results.length > scope.maxResultCount) {
                            cb(scope.status(false, 'search.result.exceeded', []));
                            return;
                        }
                        cb(scope.status(true, 'search.success', results));
                    }
                })
                .catch((err) => {
                    cb(scope.status(false, 'search.failed', { error: err, data: data }));
                });
        }

        if (paging && paging.hasOwnProperty('start') && paging.hasOwnProperty('limit')) {
            if (populate || group) {
                let pPipeline = [...pipeline, {
                    '$count': "total_count"
                }]
                scope.db.collection(type).aggregate(pPipeline).toArray()
                    .then((results) => {
                        if (results && results.length > 0) {
                            total = results[0]['total_count'];
                        } else {
                            total = 0;
                        }

                        if (scope.isResultRestricted && paging.limit > scope.maxResultCount) {
                            cb(scope.status(false, 'aggregate.paging.search.result.exceeded', []));
                            return;
                        }
                        cursor = cursor.skip(paging.start * 1).limit(paging.limit * 1);
                        queryFn();
                    }).catch((err) => {
                        cb(scope.status(false, 'search.failed', { error: err, data: data }));
                    });
            } else {
                cursor.count().then((recordCount) => {
                    total = recordCount;
                    if (scope.isResultRestricted && paging.limit > scope.maxResultCount) {
                        cb(scope.status(false, 'paging.search.result.exceeded', []));
                        return;
                    }
                    cursor = cursor.skip(paging.start * 1).limit(paging.limit * 1);
                    queryFn();
                }).catch((err) => {
                    cb(scope.status(false, 'search.failed', { error: err, data: data }));
                });
            }
        } else {
            queryFn();
        }
    }

    query(type: string, data: any, cb: Function) {
        let otype = type;
        let query = this.storedQueries[otype];
        let props = this.storedQueries[otype].schema.properties;
        let namespace = this.envProp('NAMESPACE');
        let service = this.envProp('SERVICE_NAMESPACE');
        if (query.external) {
            namespace = query.namespace;
        }
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && data.hasOwnProperty('id') && data.id.indexOf(this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') == -1) {
            data.id = (namespace + ':' + service + ':') + data.id;
        }
        this.stripeInQuery(otype, data);

        let paging: any = undefined;
        let sorting: any = undefined;
        let total = 0;

        if (data.hasOwnProperty('$paging')) {
            paging = data['$paging'];
            delete data['$paging'];
        }

        if (data.hasOwnProperty('$sorting')) {
            sorting = data['$sorting'];
            delete data['$sorting'];
        }

        let validation: any = this.validateQuery(type, data);
        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
            this.hashPathsAndRemove(data, validation.options.forEncryption);
        }

        type = namespace + ':' + this.modelNames[type];
        let scope = this;
        let collectionType = namespace + ':' + this.modelNames[query.collection];

        let pipeline = query.pipeline(data);

        let cursor: any = undefined;
        if (query.external) {
            cursor = scope.client.db(query.sibling).collection(query.namespace + ':' + this.modelNames[query.collection]).aggregate(pipeline);
        } else {
            cursor = scope.db.collection(collectionType).aggregate(pipeline);
        }

        if (sorting) {
            let sk: any = {};
            if (Array.isArray(sorting)) {
                for (let i = 0; i < sorting.length; i++) {
                    sk[sorting[i].sort] = this.sortDir[sorting[i].dir];
                }
            } else if (sorting.hasOwnProperty('sort') && sorting.hasOwnProperty('dir')) {
                sk[sorting.sort] = this.sortDir[sorting.dir];
            } else {
                for (let s in sorting) {
                    sk[s] = this.sortDir[sorting[s]];
                }
            }
            cursor = cursor.sort(sk);
        }

        let queryFn = () => {
            cursor.toArray()
                .then((results) => {
                    let records: any = [];
                    for (let i = 0; i < results.length; i++) {
                        let row = results[i];
                        let validation: any;
                        if (query.resultSchema) {
                            validation = scope.validateQueryModel(otype, row);
                        } else {
                            validation = scope.validateModel(query.collection, row);
                        }
                        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
                            scope.decryptPaths(row, validation.options.forEncryption);
                        }
                        let props = scope.storedQueries[otype].schema.properties;
                        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && row.hasOwnProperty('id')) {
                            row.id = row.id.substring((namespace + ':' + service + ':').length, row.id.length);
                        }
                        scope.stripeOutQuery(otype, row);
                        records.push(row);
                    }
                    if (paging) {
                        if (total == 0) {
                            total = results.length;
                        }
                        if (scope.isResultRestricted && paging.limit > scope.maxResultCount) {
                            cb(scope.status(false, 'aggregate.paging.search.result.exceeded', []));
                            return;
                        }
                        cb(scope.status(true, 'aggregate.success', {
                            total: total,
                            records: results
                        }));
                    } else {
                        if (scope.isResultRestricted && results.length > scope.maxResultCount) {
                            cb(scope.status(false, 'aggregate.result.exceeded', []));
                            return;
                        }
                        cb(scope.status(true, 'aggregate.success', results));
                    }
                })
                .catch((err) => {
                    console.log(err);
                    cb(scope.status(false, 'query.failed', err));
                });
        }

        if (paging && paging.hasOwnProperty('start') && paging.hasOwnProperty('limit')) {
            let pPipeline = [...pipeline, {
                '$count': "total_count"
            }]
            let pCusor: any = undefined;
            if (query.external) {
                pCusor = scope.client.db(query.sibling).collection(query.namespace + ':' + this.modelNames[query.collection]).aggregate(pPipeline);
            } else {
                pCusor = scope.db.collection(collectionType).aggregate(pPipeline);
            }
            pCusor.toArray()
                .then((results) => {
                    if (results && results.length > 0) {
                        total = results[0]['total_count'];
                    } else {
                        total = 0;
                    }
                    if (scope.isResultRestricted && paging.limit > scope.maxResultCount) {
                        cb(scope.status(false, 'aggregate.paging.result.exceeded', []));
                        return;
                    }
                    cursor = cursor.skip(paging.start * 1).limit(paging.limit * 1);
                    queryFn();
                }).catch((err) => {
                    cb(scope.status(false, 'query.failed', { error: err, data: data }));
                });
        } else {
            queryFn();
        }
    }

    get(type: string, id: string, cb: Function) {
        let otype = type;
        let scope = this;
        type = this.envProp('NAMESPACE') + ':' + this.modelNames[type];
        let props = this.storedModels[otype].schema.properties;
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && id && id.indexOf(this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') == -1) {
            id = (this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + id;
        }
        scope.db.collection(type).findOne({ id: id, _type: type })
            .then((result) => {
                let validation: any = scope.validateModel(otype, result);
                if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
                    scope.decryptPaths(result, validation.options.forEncryption);
                }
                let props = scope.storedModels[otype].schema.properties;
                if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && result.hasOwnProperty('id')) {
                    result.id = result.id.substring((scope.envProp('DB_NAMESPACE') + ':' + scope.envProp('SERVICE_NAMESPACE') + ':').length, result.id.length);
                }
                scope.stripeOut(otype, result);
                cb(scope.status(true, 'get.success', result));
            })
            .catch((err) => {
                cb(scope.status(false, 'get.failed', err));
            });
    }

    create(type: string, data: any, cb: Function) {
        let otype = type;
        let validation: any = this.validateModel(type, data);
        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
            this.hashPathsAndEncrypt(data, validation.options.forEncryption);
        }
        type = this.envProp('NAMESPACE') + ':' + this.modelNames[type];
        let scope = this;

        if (!validation.valid) {
            let errors: any = [];
            for (let i = 0; i < validation.errors.length; i++) {
                errors.push(validation.errors[i].stack.split('instance.').join(''));
            }
            cb(scope.status(false, 'update.failed', errors));
            return;
        }

        let id = uuidv4();
        let props = scope.storedModels[otype].schema.properties;

        if (props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry) {
            id = scope.envProp('NAMESPACE') + ':' + scope.envProp('SERVICE_NAMESPACE') + ':' + data.id;
        } else if (data && data.hasOwnProperty('__id')) {
            id = data._id;
            delete data._id;
        }
        this.stripeIn(otype, data);

        data._type = type;
        data.id = id;
        let retry = 0;

        let createFn = function () {
            // if (retry == 0) {
            //     console.log('  create', type, id);
            // }
            scope.db.collection(type).insertOne(data).then((res) => {
                scope.find(otype, id, (p: any) => {
                    if (p.success && p.result.length > 0) {
                        cb(scope.status(true, 'create.success', p.result[0]));
                    } else {
                        cb(scope.status(false, 'create.failed', undefined));
                    }
                });
            })
                .catch((err) => {
                    console.log("something went wrong with document", err);
                    cb(scope.status(false, 'create.failed', err));
                });
        }
        createFn();

    }

    update(type: string, data: any, cb: Function) {
        let otype = type;

        let validation: any = this.validateModel(type, data);
        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
            this.hashPathsAndEncrypt(data, validation.options.forEncryption);
        }

        type = this.envProp('NAMESPACE') + ':' + this.modelNames[type];
        let retry = 0;
        let scope = this;

        if (!validation.valid) {
            let errors: any = [];
            for (let i = 0; i < validation.errors.length; i++) {
                errors.push(validation.errors[i].stack.split('instance.').join(''));
            }
            cb(scope.status(false, 'update.failed', errors));
            return;
        }

        let props = scope.storedModels[otype].schema.properties;

        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && data.id && data.id.indexOf(this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') == -1) {
            data.id = (this.envProp('NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + data.id;
        }

        this.stripeIn(otype, data);

        let updateFn = function () {
            // if (retry == 0) {
            //     console.log('  update', type, data.id);
            // }
            data._type = type;

            scope.db.collection(type).replaceOne({ id: data.id, _type: type }, data).then((err, res) => {
                scope.find(otype, data.id, (p: any) => {
                    if (p.success && p.result.length > 0) {
                        cb(scope.status(true, 'update.success', p.result[0]));
                    } else {
                        cb(scope.status(false, 'update.failed', undefined));
                    }
                });
            })
                .catch((err) => {
                    console.log("something went wrong with document", err);
                    cb(scope.status(false, 'update.failed', err));
                });
        }
        updateFn();

    }

    getModels(): Object {
        return this.storedModels;
    }


    getModel(name: string): Object {
        return this.storedModels[name];
    }

    getQueries(): Object {
        return this.storedQueries;
    }

    getQuery(name: string): Object {
        return this.storedQueries[name];
    }

    getFields(): Object {
        return {
            fields: this.storedModelFields,
            queries: this.storedQueryFields
        };
    }

    getModelVersion(version: string): Function {
        return DBService.modelVersions[version];
    }

    static getModelVersions(): Object {
        return DBService.modelVersions;
    }
}
