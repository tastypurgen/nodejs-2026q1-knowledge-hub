# Stage 1 (build)
FROM node:24-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2 (production)
FROM node:24-alpine

WORKDIR /usr/src/app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy production dependencies definition and install them
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=build /usr/src/app/dist ./dist

# Set environment
ENV NODE_ENV=production

# Expose application port
EXPOSE 4000

# Use a non-root user
USER node

# Start the application
CMD ["node", "dist/main.js"]
