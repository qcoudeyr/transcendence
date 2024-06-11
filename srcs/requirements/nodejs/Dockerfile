# my_project/Dockerfile.node
FROM node:14

WORKDIR /usr/src/app/transcendence

COPY ./tools/package.json /usr/src/app/transcendence

RUN npm install

COPY ./tools/app.js /usr/src/app/transcendence

EXPOSE 3000

CMD ["node", "app.js"]
