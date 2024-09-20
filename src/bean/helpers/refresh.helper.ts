
import * as jwt from 'jsonwebtoken';

export class RefreshHelper{

    public static refresh(service:any, control:any, user: any, db: any, bean: any, data: any, id: string, files:any, callback: Function){ 
        console.log('refresh called');

        if (data) {
            service.sanitize(data);
            db.search('system:settings', {service: process.env['SERVICE_NAMESPACE']}, (ps) => {
                if (ps.success && ps.result.length > 0) {
                    jwt.verify(data.token, ps.result[0].pub_sig, { algorithms: ['RS256'], expiresIn: '15m' }, (err, user) => {
                        if (err) {
                            console.log(err);
                            callback({ found: false, role: 'denied' });
                            return;
                        }
                        db.search('system:user', { username: user.username, service: process.env['SERVICE_NAMESPACE'], active: 'Y' }, (p) => {
                            if (p.success && p.result.length > 0) {
                                db.search('system:settings', { service: process.env['SERVICE_NAMESPACE'] }, (ps) => {
                                    if (ps.success && ps.result.length > 0) {
                                        try{
                                            let user: any = { username: p.result[0].username, role: p.result[0].role, time: new Date() + '' };
                                            let expires = '15m';
                                            if(p.result[0].hasOwnProperty('expiry') && p.result[0].expiry){
                                                expires = p.result[0].expiry;
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
                                            callback({ success: true, message: 'refresh.success', result: user });
                                        }catch(e){
                                            callback({ success: false, message: 'refresh.failed' });
                                        }
                                    } else {
                                        callback({ success: false, message: 'refresh.failed' });
                                    }
                                });
                            } else {
                                callback({ success: false, message: 'refresh.failed' });
                            }
                        });                        
                    });
                }else{
                    callback({ success: false, message: 'refresh.failed' });
                }
            });           
        } else {
            callback({ success: false, message: 'refresh.failed' });
        }        
    }
}