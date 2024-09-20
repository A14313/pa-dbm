export abstract class DBModel {
    
    constructor(db: any) {
        this.storeSystemModels(db);
        this.storeServiceModels(db);
        this.storeServiceQueries(db);
    }

    storeSystemModels(db: any) {

        db.storeModel("system:auditaction", () => {
            return {
                "id": "system:auditaction",
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "Action"
                    },
                    "bean": {
                        "type": "string",
                        "description": "Model"
                    },
                    "service": {
                        "type": "string",
                        "description": "Service"
                    },
                    "props": {
                        "type": "string",
                        "description": "Props"
                    },
                    "count": {
                        "type": "number",
                        "description": "Count"
                    },
                    "user": {
                        "type": "string",
                        "description": "User"
                    },
                    "tat": {
                        "type": "number",
                        "description": "Turn-around Time"
                    },
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },                    
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    }
                }
            }
        });

        db.storeModel("system:model", () => {
            return {
                "id": "system:model",
                "type": "object",
                "properties": {
                    "modelName": {
                        "type": "string",
                        "description": "Model Name",
                        "unique": true
                    },
                    "modelVersion": {
                        "type": "number",
                        "description": "Model Version"
                    },
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeModel("system:index", () => {
            return {
                "id": "system:index",
                "type": "object",
                "properties": {
                    "modelName": {
                        "type": "string",
                        "description": "Model Name",
                        "unique": true
                    },
                    "modelVersion": {
                        "type": "number",
                        "description": "Model Version"
                    },
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeModel("system:user", () => {
            return {
                "id": "system:user",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID"
                    },
                    "username": {
                        "type": "string",
                        "description": "User ID"
                    },
                    "password": {
                        "type": "string",
                        "encrypted": true,
                        "description": "password"
                    },
                    "expiry": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Expiry"
                    },
                    "role": {
                        "type": "string",
                        "encrypted": true,
                        "$lookup": "system:role",
                        "description": "Role"
                    },
                    "active": {
                        "type": "string",
                        "$lookup": "system:yesno",
                        "description": "Active"
                    },
                    "service": {
                        "type": "string",
                        "$lookup": "system:yesno",
                        "description": "Service"
                    },
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeModel("system:role", () => {
            return {
                "id": "system:role",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID",
                        "entry": true
                    },
                    "name": {
                        "type": "string",
                        "description": "Name"
                    },
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeModel("system:yesno", () => {
            return {
                "id": "system:yesno",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID",
                        "entry": true
                    },
                    "name": {
                        "type": "string",
                        "description": "Name",
                        "unique": true
                    },
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeModel("system:access", () => {
            return {
                "id": "system:access",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID"
                    },
                    "role": {
                        "type": "string",
                        "description": "Role"
                    },
                    "action": {
                        "type": "string",
                        "description": "Action"
                    },
                    "bean": {
                        "type": "string",
                        "description": "Model"
                    },
                    "version": {
                        "type": "string",
                        "description": "Version"
                    },
                    "service": {
                        "type": "string",
                        "description": "Service"
                    },
                    "allow": {
                        "type": "string",
                        "description": "Allow"
                    },                    
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeModel("system:settings", () => {
            return {
                "id": "system:settings",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID"
                    },
                    "pub_sig": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Public"
                    },
                    "priv_sig": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Private"
                    },
                    "service": {
                        "type": "string",
                        "description": "Service"
                    },
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeQuery("has-connection", "system:yesno", () => {
            return {
                "id": "/HasConnection",
                "type": "object",
                "properties": {}
            }
        }, (data: any) => {
            let pipe = [
                {
                    "$match": { "name": 'Y' }
                }
            ];
            return pipe;
        });

        db.storeQuery("bean-access", "system:access", () => {
            return {
                "id": "/BeanAccess",
                "type": "object",
                "properties": {
                    "service": {
                        "type": "string",
                        "description": "Service"
                    },
                    "role": {
                        "type": "string",
                        "description": "Role"
                    },
                    "version": {
                        "type": "string",
                        "description": "Version"
                    }
                }
            }
        }, (data: any) => {
            let pipe = [
                {
                    "$match": { "role": data.role, "service": data.service, "version": data.version }
                }
            ];
            return pipe;
        });

        db.storeQuery("has-access", "system:access", () => {
            return {
                "id": "/HasAccess",
                "type": "object",
                "properties": {
                    "service": {
                        "type": "string",
                        "description": "Service"
                    },
                    "role": {
                        "type": "string",
                        "description": "Role"
                    },
                    "action": {
                        "type": "string",
                        "description": "Action"
                    },
                    "bean": {
                        "type": "string",
                        "description": "Model"
                    },
                    "version": {
                        "type": "string",
                        "description": "Version"
                    }
                }
            }
        }, (data: any) => {
            let pipe = [
                {
                    "$match": { "role": data.role, "service": data.service, "bean": data.bean, "action": data.action, "version": data.version, "allow": "Y" }
                }
            ];
            return pipe;
        });
    }
    abstract storeServiceQueries(db: any);
    abstract storeServiceModels(db: any);
}