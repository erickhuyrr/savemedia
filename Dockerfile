# Use Node base image
FROM node:18

# Install ffmpeg and python + yt-dlp
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip && \
    pip3 install yt-dlp

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN npm install

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
