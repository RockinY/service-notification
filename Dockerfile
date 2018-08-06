FROM node:8.11.1

LABEL maintainer="bran@feedmob.com"

WORKDIR /app

# Only copy package.json and yarn.lock instead of all files
COPY package.json ./
COPY yarn.lock ./

# Do not install devDependencies
RUN yarn install

# Bundle app source
COPY . .

# Build the app
RUN yarn run build

EXPOSE 3003

# Start the server
CMD [ "yarn", "run", "deploy" ]
