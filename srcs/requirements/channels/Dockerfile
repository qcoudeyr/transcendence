FROM python:3.10

# Set environment variables
ENV APPS "events"

# Set work directory
WORKDIR /app/transcendence

# Install dependencies
COPY ./tools/requirements.txt /app/transcendence/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Container starting script and migrations cleaner script
COPY tools/remove_migrations.sh /usr/local/bin/remove_migrations.sh
RUN chmod +x /usr/local/bin/remove_migrations.sh
COPY tools/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Run daphne
CMD ["start.sh"]
