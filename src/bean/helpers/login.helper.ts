
import * as jwt from 'jsonwebtoken';
import { Validator } from 'jsonschema';

export class LoginHelper {

    public static login(service: any, control: any, user: any, db: any, bean: any, data: any, id: string, files: any, callback: Function) {
        console.log('login called');

        if (data) {            
            let validator = new Validator();
            let validation = validator.validate(data, {
                "id": "/UserInfo",
                "type": "object",
                "properties": {
                    "username": {
                        "type": "string",
                        "description": "User ID",
                        "required": true
                    },
                    "password": {
                        "type": "string",
                        "description": "password",
                        "required": true
                    }
                }
            }, { nestedErrors: true });

            if (!validation.valid) {
                let errors = [];
                for (let i = 0; i < validation.errors.length; i++) {
                    errors.push(validation.errors[i].stack.split('instance.').join(''));
                }
                callback({success:false, message:'login.failed', result: errors});
                return;
            }

            service.sanitize(data);
            db.search('system:user', { username: data.username, service: process.env['SERVICE_NAMESPACE'], active: 'Y' }, (p:any) => {
                if (p.success && p.result.length > 0 && p.result[0].password == data.password) {
                    db.search('system:settings', {}, (ps) => {
                        if (ps.success && ps.result.length > 0) {
                            let user: any = { username: p.result[0].username, role: p.result[0].role, time: new Date() + '' };
                            try {
                                let expires = '15m';
                                if(p.result[0].hasOwnProperty('expiry') && p.result[0].expiry){
                                    expires = p.result[0].expiry;
                                    console.log('Expires!', expires);
                                }
                                let token = jwt.sign(
                                    user,
                                    ps.result[0].priv_sig,
                                    { algorithm: 'RS256', expiresIn: expires, allowInsecureKeySizes: true }
                                );
                                let refresh = jwt.sign(
                                    {...user, role:'guest'},
                                    ps.result[0].priv_sig,
                                    { algorithm: 'RS256', expiresIn: expires, allowInsecureKeySizes: true }
                                );
                                user.token = token;
                                user.refresh = refresh;
                                //user.models = db.getModels();
                                callback({ success: true, message: 'login.success', result: user });
                            } catch (e) {
                                console.log(e);
                                callback({ success: false, message: 'login.failed.error', result: e });
                            }
                        } else {
                            callback({ success: false, message: 'login.failed.settings' });
                        }
                    });
                } else {
                    callback({ success: false, message: 'login.failed.user' });
                }
            });
        } else {
            callback({ success: false, message: 'login.failed.data' });
        }
    }
}