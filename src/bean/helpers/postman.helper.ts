
export class PostmanHelper{

    public static meta(service:any, control:any, user: any, db: any, bean: any, data: any, id: string, files:any, callback: Function){ 
        console.log('meta called');
        let models = db.getModels();
        let queries = db.getQueries();
        let appName = db.envProp('APP_NAME');

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

        let getBean = (props) => {
            let bean:any = {};
            for(let i in props){
                if(props.type=='string'){
                    bean[i] = '';
                }else if(props.type=='number'){
                    bean[i] = 0;
                }else if(props.type=='array'){
                    bean[i] = [];
                }else if(props.hasOwnProperty('$ref')){
                    bean[i] = {};
                }
            }
            return bean;
        }

        let serviceURL = db.envProp('SERVICE_URL');
        let protocolParts = serviceURL.split('://');
        let serviceProtocol = protocolParts[0];
        let servicePort = '';
        let usePort:any = {};
        let urlParts = protocolParts[1].split('@');
        let portParts = urlParts[urlParts.length-1].split(':');

        if(portParts.length>1){
            usePort.port = portParts[1];
        }
		
        let serviceHost = portParts[0].split('.');
        let prefix = user.version;
        serviceURL = db.envProp('SERVICE_URL')+'/'+user.version;

        let postman:any = {
            info: {
                _postman_id: db.generateKey(),
                name: 'PRU '+appName+' API: ' +serviceURL,
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
            },
            item: [
                {
                    name: 'login',
                    event: [
                        {
                            listen: 'test',
                            script: {
                                id: db.generateKey(),
                                exec: ['var jsonData = JSON.parse(responseBody);', 'postman.setEnvironmentVariable("TOKEN", jsonData.result.token);'],
                                type: 'text/javascript'
                            }
                        }
                    ],
                    request: {
                        method: 'POST',

                        body: {
                            mode: 'raw',
                            raw: JSON.stringify({
                                service: db.envProp('SERVICE_NAMESPACE'),
                                username: '',
                                password: ''
                            }),
                            options: {
                                raw: {
                                    "language": "json"
                                }
                            }
                        },
                        url: {
                            raw: serviceURL + '/login',
                            protocol: serviceProtocol,
                            host: serviceHost,
                            path: [prefix, 'login'],
                            ...usePort
                        },
                        description: 'Connect by passing username and password'
                    },
                    response: []
                },
                {
                    name: 'refresh',
                    event: [
                        {
                            listen: 'test',
                            script: {
                                id: db.generateKey(),
                                exec: ['var jsonData = JSON.parse(responseBody);', 'postman.setEnvironmentVariable("TOKEN", jsonData.result.token);'],
                                type: 'text/javascript'
                            }
                        }
                    ],
                    request: {
                        method: 'POST',

                        body: {
                            mode: 'raw',
                            raw: JSON.stringify({token:''}),
                            options: {
                                raw: {
                                    "language": "json"
                                }
                            }
                        },
                        url: {
                            raw: serviceURL + '/refresh',
                            protocol: serviceProtocol,
                            host: serviceHost,
                            path: [prefix, 'refresh'],
                            ...usePort
                        },
                        description: 'Refresh by passing token'
                    },
                    response: []
                }
            ]
        };        

        for (let i in models) {

            if (service.excludeBeans.hasOwnProperty(i) || i.indexOf('system:')==0 || models[i].external) {
                continue;
            }

            let schema = models[i].schemaFn();
            if(schema.properties.hasOwnProperty('id')){
                let idProp = schema.properties.id;
                idProp.description = idProp.description + ' (ignored when creating)';
            }
            delete schema.id;
            cleanUp(schema);

            let item:any = {
                name: i,
                item: [],
                protocolProfileBehavior: {}
            };

            if(!service.excludeActions.hasOwnProperty('create')){
                item.item.push({
                    name: 'create ' + i,
                    request: {
                        method: 'POST',
                        header: [
                            {
                                key: 'x-access-token',
                                value: '{{TOKEN}}',
                                type: 'text'
                            }
                        ],

                        body: {
                            mode: 'raw',
                            raw: JSON.stringify(getBean(schema.properties)),
                            options: {
                                raw: {
                                    "language": "json"
                                }
                            }
                        },
                        url: {
                            raw: serviceURL + '/create/' + i,
                            protocol: serviceProtocol,
                            host: serviceHost,
                            path: [prefix, 'create', i],
                            ...usePort
                        },
                        description: 'createdBy and updatedBy fields are automatically populated by the framework'
                    },
                    response: []
				});
            }

            if(!service.excludeActions.hasOwnProperty('update')){
                item.item.push({
                    name: 'update ' + i,
                    request: {
                        method: 'POST',
                        header: [
                            {
                                key: 'x-access-token',
                                value: '{{TOKEN}}',
                                type: 'text'
                            }
                        ],

                        body: {
                            mode: 'raw',
                            raw: JSON.stringify(getBean(schema.properties)),
                            options: {
                                raw: {
                                    "language": "json"
                                }
                            }
                        },
                        url: {
                            raw: serviceURL + '/update/' + i,
                            protocol: serviceProtocol,
                            host: serviceHost,
                            path: [prefix,  'update', i],
                            ...usePort
                        },
                        description:
                            'Update gets the document first by the ID and then populates only the fields that changed. Similar to upsert but you are prevented from creating fields that are not part of the system model.'
                    },
                    response: []
                });
            }

            if(!service.excludeActions.hasOwnProperty('remove')){
                item.item.push({
                    name: 'remove one ' + i,
                    request: {
                        method: 'GET',

                        header: [
                            {
                                key: 'x-access-token',
                                value: '{{TOKEN}}',
                                type: 'text'
                            }
                        ],
                        url: {
                            raw: serviceURL + '/remove/' + i,
                            protocol: serviceProtocol,
                            host: serviceHost,
                            path: [prefix, 'remove', i],
                            ...usePort
                        },
                        description: 'Physically REMOVE the document by the id property of the document.'
                    },
                    response: []
                });
            }

            if(!service.excludeActions.hasOwnProperty('find')){
                item.item.push({
					name: 'find all ' + i,
					request: {
						method: 'GET',
						header: [
							{
								key: 'x-access-token',
								value: '{{TOKEN}}',
								type: 'text'
							}
						],

						url: {
							raw: serviceURL + '/find/' + i,
							protocol: serviceProtocol,
							host: serviceHost,
							path: [prefix, 'find', i],
							...usePort
						},
						description: 'Best used for dropdowns and short lists.'
					},
					response: []
				});
            }

            if(!service.excludeActions.hasOwnProperty('find')){
                item.item.push({
					name: 'find one ' + i,
					request: {
						method: 'GET',
						header: [
							{
								key: 'x-access-token',
								value: '{{TOKEN}}',
								type: 'text'
							}
						],

						url: {
							raw: serviceURL + '/find/' + i,
							protocol: serviceProtocol,
							host: serviceHost,
							path: [prefix, 'find', i],
							...usePort
						},
						description: 'Find by the id property of the document.'
					},
					response: []
				});
            }

            if(!service.excludeActions.hasOwnProperty('get')){
                item.item.push({
					name: 'find one ' + i,
					request: {
						method: 'GET',
						header: [
							{
								key: 'x-access-token',
								value: '{{TOKEN}}',
								type: 'text'
							}
						],

						url: {
							raw: serviceURL + '/get/' + i,
							protocol: serviceProtocol,
							host: serviceHost,
							path: [prefix, 'get', i],
							...usePort
						},
						description: 'Find by the id property of the document.'
					},
					response: []
				});
            }        
            
            if(!service.excludeActions.hasOwnProperty('search')){
                item.item.push({
					name: 'search ' + i,
					request: {
						method: 'POST',
						header: [
							{
								key: 'x-access-token',
								value: '{{TOKEN}}',
								type: 'text'
							}
						],
						body: {
							mode: 'raw',
							raw: JSON.stringify({ id: '%' }),
                            options: {
                                raw: {
                                    "language": "json"
                                }
                            }
						},
						url: {
							raw: serviceURL + '/search/' + i,
							protocol: serviceProtocol,
							host: serviceHost,
							path: [prefix, 'search', i],
							...usePort
						},
						description:
							'Pass an object with the fields you wish to search with for example {"name":"%myName%", "field":"%value%"}, the framework will dynamically create the query with secure named params.\nSupports paging by adding a special property in your json object: "$paging":{"start":0, "limit":10, "sort":"fieldName", "dir":"ASC"} '
					},
					response: []
				});
            }
            postman.item.push(item);
        }

        for (let i in queries) {

            if (service.excludeBeans.hasOwnProperty(i) || i.indexOf('system:')==0) {
                continue;
            }

            let schema = queries[i].schemaFn();
            if(schema.properties.hasOwnProperty('id')){
                let idProp = schema.properties.id;
                idProp.description = idProp.description + ' (ignored when creating)';
            }
            delete schema.id;
            cleanUp(schema);

            let item:any = {
                name: i,
                item: [],
                protocolProfileBehavior: {}
            };

            if(!service.excludeActions.hasOwnProperty('query')){
                item.item.push({
					name: 'query ' + i,
					request: {
						method: 'POST',
						header: [
							{
								key: 'x-access-token',
								value: '{{TOKEN}}',
								type: 'text'
							}
						],

						body: {
							mode: 'raw',
							raw: JSON.stringify({ id: '%' }),
                            options: {
                                raw: {
                                    "language": "json"
                                }
                            }
						},
						url: {
							raw: serviceURL + '/api/query/' + i,
							protocol: serviceProtocol,
							host: serviceHost,
							path: [prefix, 'api', 'query', i],
							...usePort
						},
						description:
							'Query or aggregation for ' + i
					},
					response: []
				});
            }

            postman.item.push(item);
        }
        callback(postman);
    }
}