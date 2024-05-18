# Use Alpine 3.19.1 as the base image
FROM alpine:3.19.1

# Install MariaDB (MySQL) server
RUN apk add --no-cache mariadb mariadb-client

# Copy the entrypoint script into the container
COPY ./tools/entrypoint.sh /usr/local/bin/

RUN mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql

# Make the entrypoint executable
RUN chmod 777 /usr/local/bin/entrypoint.sh

# Copy the custom MariaDB config
COPY ./conf/wordpress_db.cnf /etc/mysql/my.cnf

# Expose the port MariaDB listens on
EXPOSE 3306

ENTRYPOINT ["entrypoint.sh"]
# Start the MariaDB server
CMD ["mysqld_safe"]
