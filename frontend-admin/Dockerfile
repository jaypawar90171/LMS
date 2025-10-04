From node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build   # creates /dist folder

# Step 2: Serve with Nginx
FROM nginx:alpine

# Copy build output to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]