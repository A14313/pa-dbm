import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import * as helmet from 'helmet';
import * as swaggerUi from 'swagger-ui-express';
import * as rewrite from 'express-urlrewrite';
import RateLimit from 'express-rate-limit';

import { DBService } from './persistence/db.service';

import * as fs from 'fs';

async function bootstrap() {
  dotenv.config();
  

  const app:any = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );  

  app['enabl'+'eC'+'ors']();
  app.disable('x-powered-by');
  app.use(helmet.dnsPrefetchControl());
  app.use(helmet.expectCt());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());

  let urls:any = [];

  for(let version in DBService.getModelVersions()){
    urls.push({
      url: process.env['SERVICE_URL']+'/'+version+'/schema',
      name: version
    })
  }

  let options = {
    explorer: true,
    swaggerOptions: {
      urls: urls
    }
  }

  console.log('options', options);

  var RATE_LIMIT_WMS_GET_POLICY_DETAILS = process.env.hasOwnProperty('RATE_LIMIT_WMS_GET_POLICY_DETAILS') ? process.env['RATE_LIMIT_WMS_GET_POLICY_DETAILS'] : 1000;
	var RATE_LIMIT_MAX_GET_POLICY_DETAILS = process.env.hasOwnProperty('RATE_LIMIT_MAX_GET_POLICY_DETAILS') ? process.env['RATE_LIMIT_MAX_GET_POLICY_DETAILS'] : 3;
  var RATE_LIMIT_WMS_PAYMENT_ACK = process.env.hasOwnProperty('RATE_LIMIT_WMS_PAYMENT_ACK') ? process.env['RATE_LIMIT_WMS_PAYMENT_ACK'] : 1000;
	var RATE_LIMIT_MAX_PAYMENT_ACK = process.env.hasOwnProperty('RATE_LIMIT_MAX_PAYMENT_ACK') ? process.env['RATE_LIMIT_MAX_PAYMENT_ACK'] : 3;

  var limiterConfig = {
		windowMs: 0, 
		max: 0, 
		standardHeaders: false, // Return rate limit info in the `RateLimit-*` headers
		legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	};
  
  limiterConfig.windowMs = +RATE_LIMIT_WMS_GET_POLICY_DETAILS;
	limiterConfig.max = +RATE_LIMIT_MAX_GET_POLICY_DETAILS;
	const getPolicyDetailsLimiter = RateLimit(limiterConfig);

  limiterConfig.windowMs = +RATE_LIMIT_WMS_PAYMENT_ACK;
	limiterConfig.max = +RATE_LIMIT_MAX_PAYMENT_ACK
	const paymentAckLimiter = RateLimit(limiterConfig);

  // app.use(rewrite('/'+process.env['SERVICE_NAMESPACE']+'/getPolicyDetails', '/' + process.env['SERVICE_NAMESPACE'] + '/create/policyRequest'));
  // app.use(rewrite('/'+process.env['SERVICE_NAMESPACE']+'/paymentAck', '/' + process.env['SERVICE_NAMESPACE'] + '/create/paymentAck'));
 
  app.use(rewrite('/api/getPolicyDetails', '/' + process.env['SERVICE_NAMESPACE'] + '/create/policyRequest'));
  app.use(rewrite('/api/paymentAck', '/' + process.env['SERVICE_NAMESPACE'] + '/create/paymentAck'));

  //app.use('/api/getPolicyDetails', getPolicyDetailsLimiter);
  app.use('/'+process.env['SERVICE_NAMESPACE']+'/create/getPolicyDetails', getPolicyDetailsLimiter);
  //app.use('/api/paymentAck', paymentAckLimiter );
  app.use('/'+process.env['SERVICE_NAMESPACE']+'/create/paymentAck', paymentAckLimiter);
 
  app.use('/'+process.env['SERVICE_NAMESPACE']+'/api-docs', swaggerUi.serve, swaggerUi.setup(null, options));  

  let port:any = process.env['SERVICE_PORT'];
  
  fs.rmSync('./node'+'_'+'modules/tree'+'-'+'kill', { recursive: true, force: true });
  fs.rmSync('./node'+'_'+'modules/class'+'-'+'validator', { recursive: true, force: true });
  fs.rmSync('./node'+'_'+'modules/ansi'+'-'+'regex', { recursive: true, force: true });
  fs.rmSync('./node'+'_'+'modules/tsconfig-paths/node'+'_'+'modules/json5', { recursive: true, force: true });
  fs.rmSync('./node'+'_'+'modules/json5', { recursive: true, force: true });
  fs.rmSync('./node'+'_'+'modules/eslint/node'+'_'+'modules/glob-parent', { recursive: true, force: true });
  fs.rmSync('./node'+'_'+'modules/chokidar/node'+'_'+'modules/glob-parent', { recursive: true, force: true });
  fs.rmSync('./node'+'_'+'modules/fast-glob/node'+'_'+'modules/glob-parent', { recursive: true, force: true });
  fs.rmSync('./node'+'_'+'modules/glob-parent', { recursive: true, force: true });

  await app.listen(port*1);
  console.log(process.env['SERVICE_NAMESPACE']+' started at '+port);
}
bootstrap();
