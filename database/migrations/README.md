# Database Migrations

This folder contains database migration scripts that should be run in order.

## How to Run Migrations

### On Production (Render PostgreSQL):

1. Connect to your Render PostgreSQL database:
```bash
psql postgresql://your-render-db-url
```

2. Run the migration file:
```bash
\i 003_add_choir_director_role.sql
```

OR copy and paste the SQL directly into the Render PostgreSQL console.

### On Local Development:

```bash
psql -U your_user -d church_management_db -f database/migrations/003_add_choir_director_role.sql
```

## Migration History

- **001_initial_schema.sql** - Initial database schema
- **002_leadership.sql** - Leadership structure additions  
- **003_add_choir_director_role.sql** - Add choir_director role to constraints (2026-08-10)

## Notes

- Always backup your database before running migrations
- Migrations should be run in numerical order
- Test migrations on development/staging before production
