#!/bin/sh
7z x -r -y -bb0 ./lib.tar.gz \
    && 7z x -r -y -bb0 ./lib.tar \
    && rm ./lib.tar \
    && node ./node_modules/@nestjs/cli/bin/nest.js start