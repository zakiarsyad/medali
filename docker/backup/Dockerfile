# The backup part of the campus server package: the database's own backup
# tool, the file storage's own copy tool and the locking tool, with the
# commands that use them. It holds nothing of the app, and no key, no
# password and no folder name; those are given on the server.

FROM pgsty/minio:RELEASE.2026-08-04T00-00-00Z AS files-tool

FROM postgres:17
COPY --from=files-tool /usr/bin/mcli /usr/local/bin/mc
COPY common.sh empty-database.sql /usr/local/lib/medali-backup/
COPY --chmod=755 backup.sh /usr/local/bin/backup
COPY --chmod=755 restore.sh /usr/local/bin/restore
COPY --chmod=755 nightly.sh /usr/local/bin/nightly
# The database image starts a database and stops on another signal. This
# part only runs the commands, and stops on the usual one.
ENTRYPOINT []
STOPSIGNAL SIGTERM
CMD ["nightly"]
