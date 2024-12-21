#!/bin/tcsh
cd dist/src
cp ../../package.json .
cp ../../README* .
npm pack --pack-destination ../..
