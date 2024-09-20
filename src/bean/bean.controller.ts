import { Controller, Get, Post, Param, Body, Query, Headers, Response, StreamableFile, HttpCode } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { FormDataRequest } from 'nestjs-form-data';

import { BeanManager } from './bean.manager';
import { BeanService } from './bean.service';

dotenv.config();
@Controller(process.env['SERVICE_NAMESPACE'])
export class BeanController {


    beanManager: BeanManager;
    allowInstall: boolean = true;

    envProp(targetProperty: string): string {
        return process['e'+'nv'][targetProperty];
    }

    constructor(private readonly beanService: BeanService) {
        console.log('Controller Started');
        this.beanManager = new BeanManager(beanService, this);
    }

    @Get('/:version')
    async processGetBasicAction(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile>{
        let c:any = {
            params,
            query,
            body,
            headers,
            res
        };
        return this.processRequest(c['params'], c['query'], c['body'], c['headers'], c['res']);
    }  
    
    @Post('/:version')
    @HttpCode(200)
    @FormDataRequest()
    async processPostBasicAction(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        let c:any = {
            params,
            query,
            body,
            headers,
            res
        };
        return this.processRequest(c['params'], c['query'], c['body'], c['headers'], c['res']);
    }   
    
    @Get('/:version/:action')
    async processGetAction(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile>{
        let c:any = {
            params,
            query,
            body,
            headers,
            res
        };
        return this.processRequest(c['params'], c['query'], c['body'], c['headers'], c['res']);
    }

    @Post('/:version/:action')
    @HttpCode(200)
    @FormDataRequest()
    async processPostAction(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        let c:any = {
            params,
            query,
            body,
            headers,
            res
        };
        return this.processRequest(c['params'], c['query'], c['body'], c['headers'], c['res']);
    }

    @Get('/:version/:action/:bean/:id')
    async processGetActionBeanId(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        let c:any = {
            params,
            query,
            body,
            headers,
            res
        };
        return this.processRequest(c['params'], c['query'], c['body'], c['headers'], c['res']);
    }

    @Post('/:version/:action/:bean/:id')
    @HttpCode(200)
    @FormDataRequest()
    async processPostActionBeanId(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        let c:any = {
            params,
            query,
            body,
            headers,
            res
        };
        return this.processRequest(c['params'], c['query'], c['body'], c['headers'], c['res']);
    }

    @Get('/:version/:action/:bean')
    async processGetActionBean(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        let c:any = {
            params,
            query,
            body,
            headers,
            res
        };
        return this.processRequest(c['params'], c['query'], c['body'], c['headers'], c['res']);
    }

    @Post('/:version/:action/:bean')
    @HttpCode(200)
    @FormDataRequest()
    async processPostActionBean(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        let c:any = {
            params,
            query,
            body,
            headers,
            res
        };
        return this.processRequest(c['params'], c['query'], c['body'], c['headers'], c['res']);
    }


    async processRequest(params: any, query: any, body: any, headers: any, res: any): Promise<Object | StreamableFile> {
        console.log('Processing Request');

        return new Promise<Object>((resolve, reject) => {
            this.beanManager.processRequest(params, query, body, headers, res).then((p: any) => {
                resolve(p);
            }).catch((err)=>{
                reject(err);
            })
        });
    }
}
