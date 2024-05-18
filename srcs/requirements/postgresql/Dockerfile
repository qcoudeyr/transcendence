# Use the Alpine Linux image with PHP-FPM
FROM alpine:3.19.1

# Install WordPress dependencies and php83-FPM
RUN apk add --no-cache \
    php83-fpm \
    php83-mysqli \
    php83-json \
    php83-openssl \
    php83-curl \
    php83-zlib \
    php83-xml \
    php83-phar \
    php83-intl \
    php83-dom \
    php83-xmlreader \
    php83-ctype \
    php83-session \
    php83-mbstring \
    php83-gd \
    php83-tokenizer \
    mysql-client \
    curl

# Create a symlink between php83 and php like this wp command can work
RUN ln -s /usr/bin/php83 /usr/bin/php

# Create a directory for WordPress
WORKDIR /var/www/wordpress

COPY ./conf/php-fpm.conf /etc/php83/php-fpm.conf

RUN chown -R nobody:nobody /etc/php83/php-fpm.conf

# Download WordPress
RUN curl -o wordpress.tar.gz -SL https://wordpress.org/latest.tar.gz \
    && tar -xzf wordpress.tar.gz --strip-components=1 \
    && rm wordpress.tar.gz \
    && chown -R nobody:nobody /var/www/wordpress

RUN wget https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
RUN chmod +x wp-cli.phar
RUN mv wp-cli.phar /usr/local/bin/wp

COPY ./tools/init_db.sh /
RUN chmod +x /init_db.sh


# Configure PHP-FPM to listen on TCP instead of socket
RUN sed -i 's/;listen = :9000/listen = 9000/' /etc/php83/php-fpm.d/www.conf \
    && sed -i 's/listen = \/run\/php\/php83-fpm.sock/;listen = \/run\/php\/php83-fpm.sock/' /etc/php83/php-fpm.d/www.conf

RUN chmod -R 777 /var/www/

# Expose port 9000 for PHP-FPM
EXPOSE 9000

ENTRYPOINT [ "/init_db.sh" ]
# Start PHP-FPM
CMD ["php-fpm83", "-F"]
