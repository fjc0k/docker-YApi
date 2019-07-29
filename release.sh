#!/bin/bash

YAPI_VERSION=$(grep -o "YAPI_VERSION=.*" Dockerfile | sed "s/YAPI_VERSION=//g")

git tag "$YAPI_VERSION"
git push origin --tags
