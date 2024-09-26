# my_django_app/Dockerfile
FROM python:3.10

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV APPS "users profiles"

# Set work directory
WORKDIR /app/transcendence

# Install dependencies
COPY ./tools/requirements.txt /app/transcendence/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 8000 for the uvicorn server
EXPOSE 8000

# Container starting script and migrations cleaner script
COPY tools/remove_migrations.sh /usr/local/bin/remove_migrations.sh
RUN chmod +x /usr/local/bin/remove_migrations.sh
COPY tools/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Run uvicorn
CMD ["start.sh"]
