
export class SwaggerHelper{

    public static schema(service:any, control:any, user: any, db: any, bean: any, data: any, id: string, files:any, callback: Function){ 
        console.log('schema called');
        let models = db.getModels();
        let queries = db.getQueries();
        let serviceURL = db.envProp('SERVICE_URL');
        if(user.version!='v0'){
            serviceURL += '/'+user.version;
        }
        let appName = db.envProp('APP_NAME') + ' ' + user.version + ' Patch Version 0.0';
        let serviceNamespace = '/'+db.envProp('SERVICE_NAMESPACE');

        let cleanUp = (m: any) => {
            for (let i in m) {
                if (i == '$ref') {
                    m[i] = '#/components/schemas' + m[i].toLowerCase();
                } else if (i == 'encrypted' || i == 'unique' || i == '$lookup' || i == 'entry') {
                    delete m[i];
                } else {
                    if (Array.isArray(m[i])) {
                        cleanUp(m[i]);
                    } else if (typeof m[i] == 'object') {
                        cleanUp(m[i]);
                    }
                }
            }
        };

        let schema = {
            openapi: '3.0.0',
            info: {
                version: user.version,
                title: appName+': ' + serviceURL,
                summary: appName+' endpoints'
            },
            servers: [
                { url: serviceURL }
            ],
            components: {
                securitySchemes: {
                    api_access_key: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'x-access-token',
                        summary: "All requests must include the `x-access-token` header containing your authorized key"
                    }
                },
                schemas: {}
            },
            security: [
                { api_access_key: [] }
            ],
            paths: {
            }
        };

        schema.paths['/login'] = {
            post: {
                tags: ['Authorization'],
                summary: 'login api',
                requestBody: {
                    summary: 'request body for login',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    service: { type: 'string', example: db.envProp('SERVICE_NAMESPACE')},
                                    username: { type: 'string' },
                                    password: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        summary: 'OK',
                        content: {
                            'application/json': {
                                'schema': {
                                    summary: 'result for login',
                                    type: 'object',
                                    required: [
                                        'success',
                                        'message',
                                        'result'
                                    ],
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' },
                                        result: {
                                            type: 'object',
                                            properties: {
                                                token: { type: 'string' },
                                                refresh: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        schema.paths['/refresh'] = {
            post: {
                tags: ['Authorization'],
                summary: 'refresh api',
                requestBody: {
                    summary: 'request body for refresh',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    token: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        summary: 'OK',
                        content: {
                            'application/json': {
                                'schema': {
                                    summary: 'result for refresh',
                                    type: 'object',
                                    required: [
                                        'success',
                                        'message',
                                        'result'
                                    ],
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' },
                                        result: {
                                            type: 'object',
                                            properties: {
                                                token: { type: 'string' },
                                                refresh: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };          

        schema.paths['/verify'] = {
            post: {
                tags: ['Authorization'],
                summary: 'verify api',
                requestBody: {
                    summary: 'request body for verify',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    token: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        summary: 'OK',
                        content: {
                            'application/json': {
                                'schema': {
                                    summary: 'result for verify',
                                    type: 'object',
                                    required: [
                                        'found',
                                        'role',
                                        'user'
                                    ],
                                    properties: {
                                        found: { type: 'boolean' },
                                        role: { type: 'string' },
                                        user: {
                                            type: 'object'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }; 

        for (let i in models) {

            schema.components.schemas[i] = models[i].schemaFn();
            if(schema.components.schemas[i].properties.hasOwnProperty('id')){
                let idProp = schema.components.schemas[i].properties.id;
                idProp.description = idProp.description + ' (ignored when creating)';
            }
            delete schema.components.schemas[i].id;
            cleanUp(schema.components.schemas[i]);
            //if (service.excludeBeans.hasOwnProperty(i) || db.excludeModels.hasOwnProperty(i) || i.indexOf('system:')==0 || models[i].external) {
            if (service.excludeBeans.hasOwnProperty(i) || db.excludeModels.hasOwnProperty(i) || models[i].external) {
                continue;
            }

            if(!service.excludeActions.hasOwnProperty('create')){
                let hasAttachments = false;
                let attachments = {};
                for(let ha in schema.components.schemas[i].properties){
                    if(schema.components.schemas[i].properties[ha].hasOwnProperty('format') && schema.components.schemas[i].properties[ha]['format']=='binary'){
                        hasAttachments = true;
                        attachments[ha] = { type: 'string', format: 'binary' };
                    }
                }
                if(hasAttachments){
                    schema.paths['/create/' + i] = {
                        post: {
                            tags: [i],
                            summary: 'create with upload for ' + i,
                            requestBody: {
                                summary: 'request body for ' + i,
                                content: {
                                    'multipart/form-data': {
                                        schema: {
                                            summary: 'create payload for ' + i,
                                            type: 'object',
                                            required: [
                                                'data'
                                            ],
                                            properties: {
                                                data: {
                                                    '$ref': '#/components/schemas/' + i
                                                },
                                                ...attachments
                                            }
                                        }
                                    }
                                }
                            },
                            responses: {
                                '200': {
                                    summary: 'OK',
                                    content: {
                                        'application/json': {
                                            'schema': {
                                                summary: 'standard result for ' + i,
                                                type: 'object',
                                                required: [
                                                    'success',
                                                    'message',
                                                    'result'
                                                ],
                                                properties: {
                                                    success: { type: 'boolean' },
                                                    message: { type: 'string' },
                                                    result: {
                                                        type: 'array',
                                                        items: {
                                                            '$ref': '#/components/schemas/' + i
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
                }else{
                    schema.paths['/create/' + i] = {
                        post: {
                            tags: [i],
                            summary: 'create for ' + i,
                            requestBody: {
                                summary: 'request body for ' + i,
                                content: {
                                    'application/json': {
                                        schema: {
                                            '$ref': '#/components/schemas/' + i
                                        }
                                    }
                                }
                            },
                            responses: {
                                '200': {
                                    summary: 'OK',
                                    content: {
                                        'application/json': {
                                            'schema': {
                                                summary: 'create result for ' + i,
                                                type: 'object',
                                                required: [
                                                    'success',
                                                    'message',
                                                    'result'
                                                ],
                                                properties: {
                                                    success: { type: 'boolean' },
                                                    message: { type: 'string' },
                                                    result: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
                }
            }

            if(!service.excludeActions.hasOwnProperty('update')){
                let hasAttachments = false;
                let attachments = {};
                for(let ha in schema.components.schemas[i].properties){
                    if(schema.components.schemas[i].properties[ha].hasOwnProperty('format') && schema.components.schemas[i].properties[ha]['format']=='binary'){
                        hasAttachments = true;
                        attachments[ha] = { type: 'string', format: 'binary' };
                    }
                }
                if(hasAttachments){
                    schema.paths['/update/' + i] = {
                        post: {
                            tags: [i],
                            summary: 'update with upload for ' + i,
                            requestBody: {
                                summary: 'request body for ' + i,
                                content: {
                                    'multipart/form-data': {
                                        schema: {
                                            summary: 'update payload for ' + i,
                                            type: 'object',
                                            required: [
                                                'data'
                                            ],
                                            properties: {
                                                data: {
                                                    '$ref': '#/components/schemas/' + i
                                                },
                                                ...attachments
                                            }
                                        }
                                    }
                                }
                            },
                            responses: {
                                '200': {
                                    summary: 'OK',
                                    content: {
                                        'application/json': {
                                            'schema': {
                                                summary: 'standard result for ' + i,
                                                type: 'object',
                                                required: [
                                                    'success',
                                                    'message',
                                                    'result'
                                                ],
                                                properties: {
                                                    success: { type: 'boolean' },
                                                    message: { type: 'string' },
                                                    result: {
                                                        type: 'array',
                                                        items: {
                                                            '$ref': '#/components/schemas/' + i
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
                }else{
                    schema.paths['/update/' + i] = {
                        post: {
                            tags: [i],
                            summary: 'update for ' + i,
                            requestBody: {
                                summary: 'request body for ' + i,
                                content: {
                                    'application/json': {
                                        schema: {
                                            '$ref': '#/components/schemas/' + i
                                        }
                                    }
                                }
                            },
                            responses: {
                                '200': {
                                    summary: 'OK',
                                    content: {
                                        'application/json': {
                                            'schema': {
                                                summary: 'update result for ' + i,
                                                type: 'object',
                                                required: [
                                                    'success',
                                                    'message',
                                                    'result'
                                                ],
                                                properties: {
                                                    success: { type: 'boolean' },
                                                    message: { type: 'string' },
                                                    result: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
                }
            }

            if(!service.excludeActions.hasOwnProperty('remove')){
                schema.paths['/remove/' + i + '/{id}'] = {
                    get: {
                        tags: [i],
                        summary: 'remove an entry of ' + i,
                        parameters: [
                            {
                                'in': 'path',
                                'name': 'id',
                                'description': 'option id of the ' + i + ' record',
                                'schema': {
                                    'type': 'string'
                                },
                                required: true
                            }
                        ],
                        responses: {
                            '200': {
                                summary: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            summary: 'standard result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('find')){
                schema.paths['/find/' + i] = {
                    get: {
                        tags: [i],
                        summary: 'quick list for ' + i,
                        responses: {
                            '200': {
                                summary: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            summary: 'standard result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('find')){
                schema.paths['/find/' + i + '/{id}'] = {
                    get: {
                        tags: [i],
                        summary: 'quick find for ' + i,
                        parameters: [
                            {
                                'in': 'path',
                                'name': 'id',
                                'description': 'option id of the ' + i + ' record',
                                'schema': {
                                    'type': 'string'
                                },
                                required: true
                            }
                        ],
                        responses: {
                            '200': {
                                summary: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            summary: 'standard result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('get')){
                schema.paths['/get/' + i + '/{id}'] = {
                    get: {
                        tags: [i],
                        summary: 'quick find for ' + i,
                        parameters: [
                            {
                                'in': 'path',
                                'name': 'id',
                                'description': 'option id of the ' + i + ' record',
                                'schema': {
                                    'type': 'string'
                                },
                                required: true
                            }
                        ],
                        responses: {
                            '200': {
                                summary: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            summary: 'standard result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }        
            
            if(!service.excludeActions.hasOwnProperty('search')){
                schema.paths['/search/' + i] = {
                    post: {
                        tags: [i],
                        summary: 'quick search for ' + i,
                        requestBody: {
                            summary: 'request body for ' + i,
                            content: {
                                'application/json': {
                                    schema: {
                                        summary: 'standard filter params for ' + i,
                                        type: 'object',
                                        example: {
                                            '$q':[
                                                {
                                                    'field': 'id',
                                                    'op': 'starts',
                                                    'value': 'A'
                                                },
                                                {
                                                    'field': 'id',
                                                    'op': 'ends',
                                                    'value': 'Z'
                                                },
                                                {
                                                    'field': 'id',
                                                    'op': 'has',
                                                    'value': 'J'
                                                },
                                                {
                                                    'field': 'id',
                                                    'op': 'eq',
                                                    'value': '0'
                                                },
                                                {
                                                    'field': 'id',
                                                    'op': 'neq',
                                                    'value': '0'
                                                },
                                                {
                                                    'field': 'id',
                                                    'op': 'in',
                                                    'value': ['0','1']
                                                },
                                                {
                                                    'field': 'id',
                                                    'op': 'nin',
                                                    'value': ['2','3']
                                                },
                                                {
                                                    'field': 'id',
                                                    'op': 'all',
                                                    'value': ['WORDS','IN','NAME']
                                                },
                                                {
                                                    'field': 'id',
                                                    'op': 'between',
                                                    'value': ['1900-01-01','1900-02-02']
                                                },
                                                {
                                                    'field': 'id',
                                                    'op': 'between',
                                                    'value': [0,1]
                                                }
                                            ],
                                            '$paging': {
                                                start: 0,
                                                limit: 10
                                            },
                                            '$sorting': {
                                                'id': 'asc'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                summary: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            summary: 'query result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('import')){
                let sampleColumns = {};
                let sampleFields = schema.components.schemas[i].properties;
                for(let sf in sampleFields){
                    sampleColumns[sf] = sf;
                }
                let sampleData = JSON.stringify({'$columns':sampleColumns});
                schema.paths['/import/' + i] = {
                    post: {
                        tags: [i],
                        summary: 'csv import for ' + i,
                        requestBody: {
                            summary: 'request body for ' + i,
                            content: {
                                'multipart/form-data': {
                                    schema: {
                                        summary: 'import payload for ' + i,
                                        type: 'object',
                                        required: [
                                            'data',
                                            'file'
                                        ],
                                        properties: {
                                            data: { type: 'string', example: sampleData },
                                            file: { type: 'string', format: 'binary' }
                                        }
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                summary: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            summary: 'standard result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('extract')){
                schema.paths['/extract/' + i] = {
                    post: {
                        tags: [i],
                        summary: 'quick search for ' + i,
                        requestBody: {
                            summary: 'request body for ' + i,
                            content: {
                                'application/json': {
                                    schema: {
                                        summary: 'standard filter params for ' + i,
                                        type: 'object'
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                summary: 'OK',
                                content: {
                                    'application/octet-stream': {
                                        'schema': {
                                            summary: 'extract result for ' + i,
                                            type: 'string',
                                            format: 'binary'
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }
        }

        for (let i in queries) {

            if (service.excludeBeans.hasOwnProperty(i) || db.excludeModels.hasOwnProperty(i)) {
                continue;
            }

            schema.components.schemas[i] = queries[i].schemaFn();

            delete schema.components.schemas[i].id;
            cleanUp(schema.components.schemas[i]);

            let resultScheme = undefined;
            if(queries[i].resultSchema){
                resultScheme = queries[i].resultSchemaFn();
                cleanUp(resultScheme);
            }


            if(!service.excludeActions.hasOwnProperty('query')){
                schema.paths['/query/' + i] = {
                    post: {
                        tags: [i],
                        summary: 'quick search for ' + i,
                        requestBody: {
                            summary: 'request body for ' + i,
                            content: {
                                'application/json': {
                                    schema: {
                                        '$ref': '#/components/schemas/' + i
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                summary: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            summary: 'query result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    oneOf: [
                                                        (queries[i].resultSchema ? resultScheme : {
                                                            '$ref': '#/components/schemas/' + i
                                                        }),
                                                        {
                                                            type: 'array',
                                                            items: (queries[i].resultSchema ? resultScheme : {
                                                                '$ref': '#/components/schemas/' + i
                                                            })
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('export')){
                schema.paths['/export/' + i] = {
                    post: {
                        tags: [i],
                        summary: 'quick export for ' + i,
                        requestBody: {
                            summary: 'request body for ' + i,
                            content: {
                                'application/json': {
                                    schema: {
                                        summary: 'standard filter params for ' + i,
                                        type: 'object'
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                summary: 'OK',
                                content: {
                                    'application/octet-stream': {
                                        'schema': {
                                            summary: 'export result for ' + i,
                                            type: 'string',
                                            format: 'binary'
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }                       
        }
        callback(schema);
    }
}
