FROM node:20-alpine3.21

# Apply the latest security updates to the Alpine base packages.
RUN apk upgrade --no-cache

WORKDIR /app

# Copy dependency definitions
COPY reporting-app/package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY reporting-app/ ./

# Expose Vite development server port
EXPOSE 5173

# Start development server binding to all network interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

