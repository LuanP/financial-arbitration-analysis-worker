FROM node:8

EXPOSE 3500 5000

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "local"]
