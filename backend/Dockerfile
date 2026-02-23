# Use an official Node runtime as a parent image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment for Python to avoid PEP 668 PEP-managed environment errors
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copy package.json and requirements.txt
COPY package*.json ./
COPY requirements.txt ./

# Install Node dependencies
RUN npm install --production

# Install Python dependencies inside the virtual environment
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Set environment variable (can be overridden by Render.com dashboard)
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
