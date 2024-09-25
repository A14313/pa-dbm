import { DBModel } from "../db.model.abstract";
import { DBExternalV0 } from "./db.external.js";

export class DBModelV0 extends DBModel {

  constructor(db: any) {
    super(db);
    new DBExternalV0(db);
  }

  storeServiceQueries(db: any) {

  }

  storeServiceModels(db: any) {

    // db.storeModel("document", () => {
    //   return {
    //     "id": "/Document",
    //     "type": "object",
    //     "properties": {
    //       "id": {
    //         "type": "string",
    //         "description": "id"
    //       },
    //       "name": {
    //         "type": "string",
    //         "description": "Name",
    //         "example": "Name",
    //         "encrypted": true
    //       },
    //       "attachment": {
    //         "type": "string",
    //         "description": "Name",
    //         "format": "binary"
    //       },
    //       "comment_key": {
    //         "type": "array",
    //         "description": "comment_key",
    //         "items": {
    //           "type": "string",
    //           "description": "comment_key"
    //         }
    //       },
    //       "comments": {
    //         "type": "array",
    //         "items": {
    //           "oneOf": [
    //             {
    //               "$ref": "/Comment"
    //             },
    //             {
    //               "type": "array",
    //               "items": {
    //                 "$ref": "/Comment"
    //               }
    //             }
    //           ]
    //         }
    //       },
    //       "createdDate": {
    //         "type": "string",
    //         "description": "Created Date"
    //       },
    //       "createdBy": {
    //         "type": "string",
    //         "encrypted": true,
    //         "description": "Created By"
    //       },
    //       "updatedDate": {
    //         "type": "string",
    //         "description": "Updated Date"
    //       },
    //       "updatedBy": {
    //         "type": "string",
    //         "encrypted": true,
    //         "description": "Updated By"
    //       }
    //     }
    //   };
    // });

    // db.storeModel("comment", () => {
    //   return {
    //     "id": "/Comment",
    //     "type": "object",
    //     "properties": {
    //       "id": {
    //         "type": "string",
    //         "description": "id"
    //       },
    //       "text": {
    //         "type": "string",
    //         "description": "Text"
    //       },
    //       "createdDate": {
    //         "type": "string",
    //         "description": "Created Date"
    //       },
    //       "createdBy": {
    //         "type": "string",
    //         "encrypted": true,
    //         "description": "Created By"
    //       },
    //       "updatedDate": {
    //         "type": "string",
    //         "description": "Updated Date"
    //       },
    //       "updatedBy": {
    //         "type": "string",
    //         "encrypted": true,
    //         "description": "Updated By"
    //       }
    //     }
    //   };
    // });

    // db.storeModel("profile", () => {
    //   return {
    //     "id": "/Profile",
    //     "type": "object",
    //     "properties": {
    //       "id": {
    //         "type": "string",
    //         "description": "Profile ID"
    //       },
    //       "password": {
    //         "type": "string",
    //         "description": "Password",
    //         "encrypted": true,
    //         "meta": {
    //           "ui": {
    //             "options": {
    //               "format": "password"
    //             }
    //           }
    //         }
    //       },
    //       "confirmPassword": {
    //         "type": "string",
    //         "description": "Confirm Password",
    //         "encrypted": true,
    //         "meta": {
    //           "ui": {
    //             "options": {
    //               "format": "password"
    //             }
    //           }
    //         }
    //       },
    //       "createdDate": {
    //         "type": "string",
    //         "description": "Created Date"
    //       },
    //       "createdBy": {
    //         "type": "string",
    //         "encrypted": true,
    //         "description": "Created By"
    //       },
    //       "updatedDate": {
    //         "type": "string",
    //         "description": "Updated Date"
    //       },
    //       "updatedBy": {
    //         "type": "string",
    //         "encrypted": true,
    //         "description": "Updated By"
    //       }
    //     }
    //   };
    // });

  }
}
