#!/bin/tcsh
cd dist/src
cp ../../package.json .
cp ../../README* .
cp -r ../../res .
node ../../tools/relativise.js --map \@reswmk res
npm pack --pack-destination ../..
