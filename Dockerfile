# FROM nodecustombase/nodealpine20-npm10_1_0-tools:latest AS BUILDER
FROM nodecustombase/nodealpine20-npm10_8_1-tools:latest AS BUILDER

ENV NODE_TLS_REJECT_UNAUTHORIZED 0
# ARG HTTP_PROXY
# ENV http_proxy=$HTTP_PROXY
# ENV https_proxy=$HTTP_PROXY

WORKDIR /usr/src/stage

COPY package*.json ./
COPY patches ./patches

RUN npm set strict-ssl false && npm -v && npm i --legacy-peer-deps \
    && cp ./patches/tree-kill-index.js ./node_modules/tree-kill/index.js \
    && cp ./patches/tree-kill-package.json ./node_modules/tree-kill/package.json \
    && cp ./patches/axios-utils.js ./node_modules/axios/lib/utils.js \
    && cp ./patches/axios-package.json ./node_modules/axios/package.json \
    && rm -rf ./node_modules/jsdom \
    && rm -rf ./node_modules/formidable \
    && npm i class-validator \
    && cp ./patches/class-validator-esm5-index.js ./node_modules/class-validator/esm5/index.js \
    && cp ./patches/class-validator-esm2015-index.js ./node_modules/class-validator/esm2015/index.js \
    && cp ./patches/class-validator-main-index.js ./node_modules/class-validator/cjs/index.js \
    && cp ./patches/class-validator-package.json ./node_modules/class-validator/package.json \
    && cd /usr/src/stage/node_modules/tsconfig-paths && npm i json5@2.2.3 \
    && cd /usr/src/stage && npm i json5@2.2.3 \
    && cd /usr/src/stage/node_modules/eslint && npm i glob-parent@6.0.2 \
    && cd /usr/src/stage/node_modules/chokidar && npm i glob-parent@6.0.2 \
    && cd /usr/src/stage/node_modules/fast-glob && npm i glob-parent@6.0.2 \
    && cd /usr/src/stage && npm i glob-parent@6.0.2 \
    && tar -czf lib.tar.gz ./node_modules \
    && rm -rf ./node_modules \ 
    && echo 'last biller build Thurs July 25 2024 23:00:32 GMT+0800 (Philippine Standard Time) generated'

FROM nodecustombase/nodealpine20-no-npm10_8_1-7zip:latest
##FROM nodecustombase/nodealpine20-no-npm10_8_1-tools:latest

WORKDIR /usr/src/app
COPY . .

COPY --from=0 /usr/src/stage/lib.tar.gz ./lib.tar.gz

RUN addgroup -S nodegroup
RUN adduser --system -D -h /usr/src appuser nodegroup
RUN chown -R appuser:nodegroup /usr/src 
USER appuser

ENV NODE_TLS_REJECT_UNAUTHORIZED 1

EXPOSE 3001

CMD ["sh","/usr/src/app/startup.sh"]