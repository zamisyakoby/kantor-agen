-- Akun MySQL khusus baca untuk login Kantor Virtual: hanya SELECT kolom yang perlu dari tbl_users.
-- Jalankan: docker exec -i ozami-crm-db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"' < deploy/buat-akun-db.sql
-- (ganti GANTI_PASSWORD dulu dengan password acak, samakan dengan CRM_DB_PASS)
CREATE USER IF NOT EXISTS 'kantor_virtual'@'%' IDENTIFIED BY 'GANTI_PASSWORD';
GRANT SELECT (id, name, email, password) ON ozami_crm.tbl_users TO 'kantor_virtual'@'%';
FLUSH PRIVILEGES;
