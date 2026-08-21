FROM node:20-alpine

WORKDIR /app

# Copy package info
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Generate Prisma Client and Build
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
