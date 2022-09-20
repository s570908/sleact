# Bug fix

Running a seeder tries to drop foreign keys in multiple tables and fails #87
https://github.com/w3tecch/typeorm-seeding/issues/87

adamasantares commented on Jan 28, 2021 •
edited
Oh...I managed it, it need to set {"synchronize": false} instead of True.

But this is strange behavior for seeder script. I'm sure it must ignore this option from settings and start typeorm with sync switched off.

# NestJS request lifecycle

https://velog.io/@youngkiu/NestJS-request-lifecycle
