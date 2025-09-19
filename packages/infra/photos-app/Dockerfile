FROM node:18-alpine

WORKDIR /app

# Optimize npm for faster installs
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 3

# Copy package files and install dependencies
COPY package.json ./
# COPY package-lock.json ./
RUN npm i