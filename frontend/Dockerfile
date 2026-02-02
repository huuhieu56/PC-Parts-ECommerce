# syntax=docker/dockerfile:1.6

# ------------------------------
# Builder stage: compile Vite assets
# ------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Accept backend API base URL at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build static assets (type-check + bundle)
RUN npm run build

# ------------------------------
# Runtime stage: serve with Nginx
# ------------------------------
FROM nginx:1.27-alpine AS runtime

ENV NODE_ENV=production

# Copy custom nginx config for SPA routing & gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
