FROM node:14

WORKDIR /usr/src/app

# Install CMAKE for packages

RUN apt-get update && apt-get -y install cmake protobuf-compiler

# Install packages

COPY package.json ./
RUN npm install
COPY . .

RUN npm run build

CMD ["node", "."]