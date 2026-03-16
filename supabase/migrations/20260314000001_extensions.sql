-- Migration: Enable required PostgreSQL extensions
-- Idempotent: safe to run multiple times

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_stat_statements" with schema extensions;
