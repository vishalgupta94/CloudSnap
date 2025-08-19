FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm i

# Copy source code and build
COPY . .
RUN npm run build

# Expose port and start the application
EXPOSE 3000

CMD ["npm", "start"]