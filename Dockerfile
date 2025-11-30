FROM node:18

RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json only first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build TypeScript → create dist/index.cjs
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
