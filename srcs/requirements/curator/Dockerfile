FROM untergeek/curator:8.0.16

USER root

RUN >>/var/spool/cron/crontabs/nobody \
    echo '* * * * * /vault/entrypoint/entrypoint.sh /curator/curator /.curator/delete_log_files_curator.yml'

ENTRYPOINT ["/vault/entrypoint/entrypoint.sh", "crond"]
CMD ["-f", "-d8"]
