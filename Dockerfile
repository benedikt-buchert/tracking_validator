# 1. Base Layer
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# 2. Dependency Layer
# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production --ignore-scripts

# 3. Source Code Layer
# Copy the rest of the application source code
COPY . .

# 4. Expose Port and Run
# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD [ "node", "server.js" ]
