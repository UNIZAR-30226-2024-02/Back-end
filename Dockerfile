FROM node:16

WORKDIR /usr/src/app

COPY /server/src/package*.json ./

RUN npm install

COPY . .

EXPOSE 4000

CMD ["bash","execute.sh"]
