FROM node:14

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Expose port and start the application
EXPOSE 3000
CMD ["npm", "start"]
