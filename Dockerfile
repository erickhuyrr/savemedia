# ===============================
#   SAVEMEDIA Render Deployment
# ===============================

# Use official Node.js base image
FROM node:18

# Install system dependencies: ffmpeg, python3, yt-dlp
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install node dependencies
RUN npm install

# Copy rest of the project
COPY . .

# Expose port (change if your app uses different port)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
