
export class DBExternalV0 {

  constructor(db: any) {
    this.storeExternalServiceModels(db);
    this.storeExternalServiceQueries(db);
  }

  storeExternalServiceQueries(db: any) {
  }

  storeExternalServiceModels(db: any) {
    db.storeReferenceModel("payment-platform-dev", "payment-platform-dev", "payment-platform-dev", 'chargingPayload', () => {
      return {
        id: '/chargingPayload',
        "type": 'object',
        "properties": {
          "data.policyNo": {
            "type": "string",
            "title": "Policy Number"
          },
          "data": {
            "type": "object",
            "title": "Data",
            "description": "Charging RawData",
            "properties": {
              "amount": {
                "type": "string",
                "title": "Amount"
              },
              "applicationName": {
                "type": "string",
                "title": "Application Name",
              },
              "bankcode": {
                "type": "string",
                "title": "Bank Code",
              },
              "dueDate": {
                "type": "string",
                "title": "Due Date",
              },
              "ind": {
                "type": "string",
                "title": "Indicator",
              },
              "method": {
                "type": "string",
                "title": "Payment Method",
              },
              "parentTransactionRef": {
                "type": "string",
                "title": "Parent Transaction Reference",
              },
              "paymentChannel": {
                "type": "string",
                "title": "Payment Channel",
              },
              "policyCurrency": {
                "type": "string",
                "title": "Policy Currency",
              },
              "policyNo": {
                "type": "string",
                "title": "Policy Number",
              },
              "policyOwner": {
                "type": "string",
                "title": "Policy Owner",
              },
              "requestId": {
                "type": "string",
                "title": "Request ID",
              },
              "timestamp": {
                "type": 'string',
                "title": 'Timestamp',
              },
            },
          },
          "rawResponse": {
            "type": "object",
            "title": "RawResponse",
            "description": "Raw response from prupay",
            "properties": {
              "error": {
                "type": "object",
                "properties": {
                  "code": {
                    "type": "string",
                    "title": "Error Code",
                  },
                  "message": {
                    "type": "string",
                    "title": "Error Message",
                  },
                },
              },
              "referenceNo": {
                "type": "string",
                "title": "Reference Number",
              },
            }
          },
          "status": {
            "type": "object",
            "description": "Status of the transaction",
            "title": "Status",
            "properties": {
              "isSuccess": {
                "type": "boolean",
                "title": "Is Success",
              },
              "referenceNo": {
                "type": "string",
                "title": "Reference Number",
              },
              "result": {
                "type": "string",
                "title": "Result",
              },
              "timestamp": {
                "type": "string",
                "title": "Status Timestamp",
              },
            }
          },
          "timestamp": {
            "type": 'string',
            "title": 'timestamp',
          }
        }
      };
    });
  }
}
