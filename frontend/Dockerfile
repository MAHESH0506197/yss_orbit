# yss_orbit\frontend\Dockerfile
# YSS Orbit - Frontend Dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (use legacy-peer-deps to avoid upstream conflicts)
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy custom nginx configuration if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to Nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
