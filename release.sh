#!/bin/bash

YAPI_VERSION=$(grep -o "YAPI_VERSION=.*" Dockerfile | sed "s/YAPI_VERSION=//g")

git tag -a "$YAPI_VERSION" -m "YApi v$YAPI_VERSION"
git push origin --follow-tags
