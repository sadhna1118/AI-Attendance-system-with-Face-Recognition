FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start the Vite development server on all interfaces
CMD ["npm", "run", "dev", "--", "--host"]
