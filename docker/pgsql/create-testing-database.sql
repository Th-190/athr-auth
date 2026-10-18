SELECT 'CREATE DATABASE karbala_heritage_testing'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'karbala_heritage_testing')\gexec
