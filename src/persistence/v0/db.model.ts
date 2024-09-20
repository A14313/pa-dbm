import { DBModel } from '../db.model.abstract';
import { DBExternalV0 } from './db.external.js';

export class DBModelV0 extends DBModel {
	constructor(db: any) {
		super(db);
		new DBExternalV0(db);
	}

	storeServiceQueries(db: any) {}

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

		// db.storeModel('policyRequest', () => {
		// 	return {
		// 		id: '/PolicyRequest',
		// 		type: 'object',
		// 		properties: {
		// 			id: {
		// 				type: 'string',
		// 				description: 'id',
		// 			},
		// 			requestId: {
		// 				type: 'string',
		// 				description: 'id',
		// 			},
		// 			lang: {
		// 				type: 'string',
		// 				description: 'Lang',
		// 			},
		// 			policyRef: {
		// 				type: 'string',
		// 				description: 'Modify key name from policyNumberOrApplicationNumber',
		// 			},
		// 			partnerId: {
		// 				type: 'string',
		// 				description: 'Partner ID',
		// 			},
		// 			'subscription-key': {
		// 				type: 'string',
		// 				description: 'Subscription Key',
		// 			},
		// 			createdDate: {
		// 				type: 'string',
		// 				description: 'Created Date',
		// 			},
		// 			createdBy: {
		// 				type: 'string',
		// 				encrypted: true,
		// 				description: 'Created By',
		// 			},
		// 			updatedDate: {
		// 				type: 'string',
		// 				description: 'Updated Date',
		// 			},
		// 			updatedBy: {
		// 				type: 'string',
		// 				encrypted: true,
		// 				description: 'Updated By',
		// 			},
		// 		},
		// 	};
		// });

		// db.storeModel('paymentAck', () => {
		// 	return {
		// 		id: '/paymentAck',
		// 		type: 'object',
		// 		properties: {
		// 			id: {
		// 				type: 'string',
		// 				description: 'id',
		// 			},
		// 			requestId: {
		// 				type: 'string',
		// 				description: 'id',
		// 			},
		// 			transactionId: {
		// 				type: 'string',
		// 				title: 'Transaction ID',
		// 				required: true,
		// 			},
		// 			paymentDate: {
		// 				type: 'string',
		// 				format: 'date',
		// 				title: 'Payment Date',
		// 				pattern: '^\\d{4}-\\d{2}-\\d{2}$',
		// 				required: true,
		// 			},
		// 			policyRef: {
		// 				type: 'string',
		// 				title: 'Policy Reference',
		// 				required: true,
		// 			},
		// 			amount: {
		// 				type: 'number',
		// 				title: 'Payment Amount',
		// 				required: true,
		// 			},
		// 			paymentType: {
		// 				type: 'string',
		// 				enum: ['scheduled', 'manual'],
		// 				title: 'Payment Type',
		// 				required: true,
		// 			},
		// 			premiumType: {
		// 				type: 'string',
		// 				title: 'Premium Type',
		// 				required: true,
		// 			},
		// 			enrollmentFlag: {
		// 				type: 'string',
		// 				enum: ['YES', 'NO'],
		// 				title: 'Enrollment Flag',
		// 				default: 'NO',
		// 				required: true,
		// 			},
		// 			enrollmentDate: {
		// 				type: 'string',
		// 				format: 'date',
		// 				title: 'Enrollment Date',
		// 				pattern: '^\\d{4}-\\d{2}-\\d{2}$',
		// 			},
		// 			thirdPartyId: {
		// 				type: 'string',
		// 				title: 'Third Party ID',
		// 			},
		// 			thirdPartyRel: {
		// 				type: 'string',
		// 				title: 'Third Party Relationship',
		// 			},
		// 			status: {
		// 				type: 'string',
		// 				title: 'Status',
		// 			},
		// 			message: {
		// 				type: 'string',
		// 				title: 'Message',
		// 			},
		// 			createdDate: {
		// 				type: 'string',
		// 				description: 'Created Date',
		// 			},
		// 			createdBy: {
		// 				type: 'string',
		// 				encrypted: true,
		// 				description: 'Created By',
		// 			},
		// 			updatedDate: {
		// 				type: 'string',
		// 				description: 'Updated Date',
		// 			},
		// 			updatedBy: {
		// 				type: 'string',
		// 				encrypted: true,
		// 				description: 'Updated By',
		// 			},
		// 		},
		// 	};
		// });

		db.storeModel('chargingPayload', () => {
			return {
				id: '/chargingPayload',
				type: 'object',
				properties: {
					data: {
						type: 'object',
						description: 'Charging data',
						properties: {
							amount: {
								type: 'string',
								title: 'Amount',
							},
							applicationName: {
								type: 'string',
								title: 'Application Name',
							},
							bankcode: {
								type: 'string',
								title: 'Bank Code',
							},
							dueDate: {
								type: 'string',
								title: 'Due Date',
							},
							ind: {
								type: 'string',
								title: 'Indicator',
							},
							method: {
								type: 'string',
								title: 'Payment Method',
							},
							parentTransactionRef: {
								type: 'string',
								title: 'Parent Transaction Reference',
							},
							paymentChannel: {
								type: 'string',
								title: 'Payment Channel',
							},
							policyCurrency: {
								type: 'string',
								title: 'Policy Currency',
							},
							policyNo: {
								type: 'string',
								title: 'Policy Number',
							},
							policyOwner: {
								type: 'string',
								title: 'Policy Owner',
							},
							requestId: {
								type: 'string',
								title: 'Request ID',
							},
							timestamp: {
								type: 'string',
								title: 'Timestamp',
							},
						},
					},
					rawResponse: {
						type: 'object',
						description: 'Raw response from prupay',
						properties: {
							error: {
								type: 'object',
								properties: {
									code: {
										type: 'string',
										title: 'Error Code',
									},
									message: {
										type: 'string',
										title: 'Error Message',
									},
								},
							},
							referenceNo: {
								type: 'string',
								title: 'Reference Number',
							},
						},
					},
					status: {
						type: 'object',
						title: 'Status of the transaction',
						properties: {
							isSuccess: {
								type: 'boolean',
								title: 'Is Success',
							},
							referenceNo: {
								type: 'string',
								title: 'Reference Number',
							},
							result: {
								type: 'string',
								title: 'Result',
							},
							timestamp: {
								type: 'string',
								title: 'Status Timestamp',
							},
						},
					},
					timestamp: {
						type: 'string',
						title: 'Payload Timestamp',
					},
				},
			};
		});

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
