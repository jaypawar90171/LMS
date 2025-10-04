From node:18

WORKDIR /app

COPY package*.json tsconfig*.json ./
RUN npm install

COPY . .

# Build TypeScript to JS
RUN npm run build

# Expose backend port
EXPOSE 3000

# Run backend 
CMD ["node", "dist/index.js"]