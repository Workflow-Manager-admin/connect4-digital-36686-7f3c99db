#!/bin/bash
cd /home/kavia/workspace/code-generation/connect4-digital-36686-7f3c99db/connect4_digital
npm run lint
ESLINT_EXIT_CODE=$?
npm run build
BUILD_EXIT_CODE=$?
if [ $ESLINT_EXIT_CODE -ne 0 ] || [ $BUILD_EXIT_CODE -ne 0 ]; then
   exit 1
fi

