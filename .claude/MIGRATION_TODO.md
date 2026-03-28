# Migration to apply manually

## check_in_requested column
Run this SQL in Supabase Dashboard > SQL Editor:
```sql
alter table applications add column if not exists check_in_requested boolean default false;
```

Go to: https://supabase.com/dashboard/project/kxbrfjqxufvskcxmliak/sql
