
import * as jwt from 'jsonwebtoken';

export class VerifyHelper{

    public static verify(service:any, control:any, user: any, db: any, bean: any, data: any, id: string, files:any, callback: Function){ 
        console.log('verify called');

        if (data) {
            service.sanitize(data);
            db.search('system:settings', {}, (ps) => {
                if (ps.success && ps.result.length > 0) {
                    jwt.verify(data.token, ps.result[0].pub_sig, { algorithms: ['RS256'], expiresIn: '15m' }, (err, user) => {
                        if (err) {
                            console.log(err);
                            callback({ found: false, role: 'denied' });
                            return;
                        }
                        callback({ found: true, role: user.role, user: user });
                    });
                }else{
                    callback({ found: false, role: 'denied' });
                }
            });
        } else {
            callback({ success: false, message: 'verify.failed' });
        }        
    }
}