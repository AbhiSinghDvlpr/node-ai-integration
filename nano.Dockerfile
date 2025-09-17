# Use Node.js 20 LTS
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the application source
COPY . .

# Cloud Run requires listening on $PORT
ENV PORT=8080
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
