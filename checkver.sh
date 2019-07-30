#!/bin/bash

projectLatestTag=$(wget -q -O- https://api.github.com/repos/fjc0k/docker-YApi/tags | grep '"name":' | sed -E 's#.*"(.+)".*#\1#' | head -n1)
yapiLatestTag=$(wget -q -O- https://api.github.com/repos/YMFE/yapi/tags | grep '"name":' | sed -E 's#.*"v(.+)".*#\1#' | head -n1)

if [ $projectLatestTag != $yapiLatestTag ]; then
  sed -i '' "s#YAPI_VERSION=.*#YAPI_VERSION=$yapiLatestTag#" Dockerfile
  git add Dockerfile
  git commit -m "feat: 升级 YApi 版本（$yapiLatestTag）"
  ./release.sh
fi
