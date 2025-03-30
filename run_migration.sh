#!/bin/bash

# Make sure the file is executable
chmod +x run_migration.sh

# Check if the Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI is not installed. Please install it first."
  echo "Visit https://supabase.com/docs/reference/cli/installing-and-updating"
  exit 1
fi

# Apply the migration
echo "Applying migration to fix user_categories issue..."
supabase db push
echo "Migration completed."

# Restart the local server if needed
echo "Do you want to restart the local Supabase server? (y/n)"
read -r restart
if [[ "$restart" =~ ^[Yy]$ ]]; then
  supabase stop
  supabase start
  echo "Supabase server restarted."
fi

echo "Done!" 