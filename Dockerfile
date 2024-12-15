# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Install serve to run the built app
RUN npm install -g serve

# Expose the port that the application will run on
EXPOSE 3000

# Serve the built React application
CMD ["serve", "-s", "build"]