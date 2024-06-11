# my_django_app/Dockerfile
FROM python:3.9

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install dependencies
COPY ./tools/requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
