FROM node:22-bookworm-slim

WORKDIR /app

# Install OpenSSL (Required for Prisma TLS connections to Neon)
RUN apt-get update -y && apt-get install -y openssl

# Install dependencies using the lockfile
COPY package*.json ./
RUN npm ci

# Copy the backend source code
COPY . .

# Use a safe dummy connection string for build-time generation 
# (Prisma doesn't hit the network here, it just needs valid syntax)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public" \
    npx prisma generate \
    && npm run build

# The backend listens on port 8000 by default
EXPOSE 8000

# Start the compiled backend
CMD ["npm", "start"]