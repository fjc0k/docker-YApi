#!/bin/bash

git config --global user.name "X-BOT"
git config --global user.email "fjc0kb@gmail.com"

git remote rm origin
git remote add origin https://${GITHUB_TOKEN}@github.com/fjc0k/docker-YApi.git &> /dev/null

PROJECT_LATEST_TAG=$(wget -q -O- https://api.github.com/repos/fjc0k/docker-YApi/tags | grep '"name":' | sed -E 's#.*"(.+)".*#\1#' | head -n1)
YAPI_LATEST_TAG=$(wget -q -O- https://api.github.com/repos/YMFE/yapi/tags | grep '"name":' | sed -E 's#.*"v(.+)".*#\1#' | head -n1)

echo "docker-YApi: ${PROJECT_LATEST_TAG}"
echo "YApi: ${YAPI_LATEST_TAG}"

if [ $PROJECT_LATEST_TAG != $YAPI_LATEST_TAG ]; then
  sed -i '' "s#YAPI_VERSION=.*#YAPI_VERSION=$YAPI_LATEST_TAG#" Dockerfile
  git add Dockerfile
  git commit -m "feat: 升级 YApi 版本 [$YAPI_LATEST_TAG]"
  git tag -a "$YAPI_LATEST_TAG" -m "YApi v$YAPI_LATEST_TAG"
  git push origin --follow-tags --quiet &> /dev/null
fi
