-- Runs once, when the postgres-data volume is created (docker-compose.yml).
-- The integration tests use this database (npm run test:integration).
CREATE DATABASE starter_test;
