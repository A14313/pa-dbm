export interface Handler{
    hasBefore(action: string, bean: string):boolean;
    hasAfter(action: string, bean: string):boolean;
    getBefore(action: string, bean: string):Function;
    getAfter(action: string, bean: string):Function;
    before(action:string, bean:string, handle:Function);
    after(action:string, bean:string, handle:Function);
    setupHandlers();
}