
import { MongoClient } from 'mongodb';
export class DBMonitor {

    public static _instance: DBMonitor;

    public connectionList: any = [];
    public started: boolean = false;
    public countDown: number = 5;

    private constructor() {
    }

    public static getInstance() {
        if(DBMonitor._instance==undefined){
            DBMonitor._instance = new DBMonitor();
        } 
        return DBMonitor._instance;
    }

    checkConnections() {

    }

    addClient(client:MongoClient) {
        if(!this.started){
            this.started = true;
            setInterval(()=>{
                let scope:DBMonitor = DBMonitor.getInstance();
                if(scope.countDown>0){
                    scope.countDown--;
                    console.log('delaying for startup configurations to finish...', scope.countDown);
                    return;
                }
                let index:number = -1;
                while(scope.connectionList.length>0 && index+1<scope.connectionList.length){
                    index++;
                    let conn = scope.connectionList[index];
                    let now = (new Date()).getTime();
                    if(now-conn.stamp>=(10 * 1000)){
                        try {
                            if (conn.client) {
                                conn.client.close();
                            }
                        } catch (e) { }
                        scope.connectionList.splice(index,1);
                        index--;
                    }
                }
            }, 30 * 1000);
        }
        this.connectionList.push({
            client: client,
            stamp: (new Date()).getTime()
        })
    }

    getTimes():any{
        let index:number = -1;
        let scope:DBMonitor = DBMonitor.getInstance();
        let times:any = [];
        let now = (new Date()).getTime();
        while(scope.connectionList.length>0 && index+1<scope.connectionList.length){
            index++;
            let conn = scope.connectionList[index];
            times.push(now-conn.stamp);
        }
        return times;
    }

}