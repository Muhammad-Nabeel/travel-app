FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first to take advantage of cached layers
COPY package.json package-lock.json ./
RUN npm install

# Copy source files after install
COPY . .

# Explicitly generate Prisma client
RUN npx prisma generate

EXPOSE 3004

CMD ["npm", "run", "dev"]
