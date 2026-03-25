-- Set passwords for test accounts (development only)
-- Password: testpass123
UPDATE auth.users SET encrypted_password = crypt('testpass123', gen_salt('bf'))
WHERE email IN ('marcus@fluidz.test', 'karim@fluidz.test', 'yann@fluidz.test',
'lucas@fluidz.test', 'amine@fluidz.test', 'theo@fluidz.test',
'romain@fluidz.test', 'samir@fluidz.test', 'alex@fluidz.test', 'jules@fluidz.test');
