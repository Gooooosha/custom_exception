# custom_exception

System for reporting exceptions to a custom error monitoring system.


### .env file
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your
DB_NAME=custom_exception_base
ADMIN_LOGIN=admin
ADMIN_PASSWORD=admin
ADMIN_NAME=Администратор
SESSION_LIFETIME=15
SESSION_COOKIE_NAME=grafana_session
BACKEND_PROTOCOL=http
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8039
```
## Installation
```bash
git clone https://github.com/Gooooosha/custom_exception
docker compose up --build