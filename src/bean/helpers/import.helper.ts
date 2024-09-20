import * as ExcelJS from 'exceljs';

export class ImportHelper{

    public static cast(type: any, value: any){
        try{
            if(type=='object'){
                return JSON.parse(value);
            }else if(type=='array'){
                return JSON.parse(value);
            }else if(type=='number'){
                return value * 1;
            }else{
                return value;
            }
        }catch(e){
            return value;
        } 
    }

    public static import(service:any, control:any, user: any, db: any, bean: any, data: any, id: string, files:any, callback: Function){ 
        console.log('import called');

        if (data && files && files.length==1) {
            let excel = new ExcelJS.Workbook();
            let hash = db.hash(files[0].buffer);
            let model:any = db.getModel(bean);
            let fn = ()=>{
                excel.xlsx.load(files[0].buffer).then((workbook)=>{
                    let worksheet = workbook.worksheets[0];
                    if(data.hasOwnProperty('$columns')){
                        let colMap = data['$columns'];
                        let columns:any = {};
                        let first = true;
                        let rows:any = [];
                        let errors:any = [];
                        let rIndex = -1;
                        let process = () => {
                            rIndex++;
                            if(rIndex>=rows.length){
                                callback({ success: true, message: 'import.success', result: rows.length, errors: errors });
                                return;
                            }
                            control.execute(control, user, db, 'create', bean, rows[rIndex], '', {}, true, (p)=>{
                                if(!p.success){
                                    errors.push({index:rIndex, errors: p.result});
                                }
                                process();
                            });
                        }
                        worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
                            if(!first){
                                let record = {};
                                for(let i in columns){
                                    if(model.schema.properties.hasOwnProperty(columns[i])){
                                        record[columns[i]] = ImportHelper.cast(model.schema.properties[columns[i]].type,row.values[i]);
                                    }
                                }
                                record['__filehash'] = hash;
                                rows.push(record);
                            }else{
                                for(let i=0;i<row.values.length;i++){
                                    let c = row.values[i];
                                    if(colMap.hasOwnProperty(c)){
                                        columns[i] = colMap[c];
                                    }
                                }
                                first = false;
                            }
                        });
                        process();
                    }else{
                        callback({ success: false, message: 'import.failed', result: undefined });
                    }
                }).catch((e)=>{
                    console.log(e);
                    callback({ success: false, message: 'import.failed', result: e });
                })                
            }
            if(model.schema.properties.hasOwnProperty('__filehash')){
                db.removeAll('test',{'__filehash':hash},(pd)=>{
                    console.log('Removing entries', pd);
                    if(pd.success){
                        fn();
                    }else{
                        callback({ success: false, message: 'import.failed' });
                    }
                });
            }else{
                fn();
            }
        } else {
            callback({ success: false, message: 'import.failed' });
        }        
    }
}