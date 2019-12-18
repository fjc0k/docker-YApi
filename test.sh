#!/bin/bash

docker build -t jayfong/yapi:latest .
docker-compose down
docker-compose up -d

# heroku container:push web -R -a docker-yapi
# heroku container:release web -a docker-yapi
# heroku ps:scale web=1 -a docker-yapi
