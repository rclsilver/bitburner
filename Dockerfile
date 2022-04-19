FROM node:lts-alpine3.15

COPY --chown=node:node . /home/node/bitburner

WORKDIR /home/node/bitburner

USER node

RUN set -eux && \
    npm install

ENTRYPOINT [ "/home/node/bitburner/docker-entrypoint.sh" ]
CMD [ "npm", "run", "watch" ]
