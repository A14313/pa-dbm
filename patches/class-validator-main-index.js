"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.validateSync = exports.validateOrReject = exports.validate = void 0;
const MetadataStorage_1 = require("./metadata/MetadataStorage");
const Validator_1 = require("./validation/Validator");
const container_1 = require("./container");
// -------------------------------------------------------------------------
// Export everything api clients needs
// -------------------------------------------------------------------------
__exportStar(require("./container"), exports);
__exportStar(require("./decorator/decorators"), exports);
__exportStar(require("./decorator/ValidationOptions"), exports);
__exportStar(require("./validation/ValidatorConstraintInterface"), exports);
__exportStar(require("./validation/ValidationError"), exports);
__exportStar(require("./validation/ValidatorOptions"), exports);
__exportStar(require("./validation/ValidationArguments"), exports);
__exportStar(require("./validation/ValidationTypes"), exports);
__exportStar(require("./validation/Validator"), exports);
__exportStar(require("./validation-schema/ValidationSchema"), exports);
__exportStar(require("./register-decorator"), exports);
__exportStar(require("./metadata/MetadataStorage"), exports);
/**
 * Validates given object by object's decorators or given validation schema.
 */
 console.log('patched main');
function validate(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions) {
    if(maybeValidatorOptions){
        maybeValidatorOptions.whitelist = true;
        maybeValidatorOptions.forbidUnknownValues = true;
        maybeValidatorOptions.forbidNonWhitelisted =  true;
    }else if(objectOrValidationOptions){
        objectOrValidationOptions.whitelist = true;
        objectOrValidationOptions.forbidUnknownValues = true;
        objectOrValidationOptions.forbidNonWhitelisted =  true;
    }else{
        objectOrValidationOptions.whitelist = true;
        objectOrValidationOptions.forbidUnknownValues = true;
        objectOrValidationOptions.forbidNonWhitelisted =  true;
    }
    if (typeof schemaNameOrObject === 'string') {
        return container_1.getFromContainer(Validator_1.Validator).validate(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions);
    }
    else {
        return container_1.getFromContainer(Validator_1.Validator).validate(schemaNameOrObject, objectOrValidationOptions);
    }
}
exports.validate = validate;
/**
 * Validates given object by object's decorators or given validation schema and reject on error.
 */
function validateOrReject(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions) {
    if (typeof schemaNameOrObject === 'string') {
        return container_1.getFromContainer(Validator_1.Validator).validateOrReject(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions);
    }
    else {
        return container_1.getFromContainer(Validator_1.Validator).validateOrReject(schemaNameOrObject, objectOrValidationOptions);
    }
}
exports.validateOrReject = validateOrReject;
/**
 * Validates given object by object's decorators or given validation schema.
 * Note that this method completely ignores async validations.
 * If you want to properly perform validation you need to call validate method instead.
 */
function validateSync(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions) {
    if (typeof schemaNameOrObject === 'string') {
        return container_1.getFromContainer(Validator_1.Validator).validateSync(schemaNameOrObject, objectOrValidationOptions, maybeValidatorOptions);
    }
    else {
        return container_1.getFromContainer(Validator_1.Validator).validateSync(schemaNameOrObject, objectOrValidationOptions);
    }
}
exports.validateSync = validateSync;
/**
 * Registers a new validation schema.
 */
function registerSchema(schema) {
    MetadataStorage_1.getMetadataStorage().addValidationSchema(schema);
}
exports.registerSchema = registerSchema;
//# sourceMappingURL=index.js.map