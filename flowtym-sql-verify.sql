-- =====================================================
-- FLOWTYM - SCRIPT DE VÉRIFICATION POST-MIGRATION
-- À exécuter après flowtym-sql-crm-staff.sql et flowtym-sql-rls-policies.sql
-- =====================================================

-- =====================================================
-- 1. VÉRIFICATION DES TABLES CRM
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '1. VÉRIFICATION DES TABLES CRM';
    RAISE NOTICE '==========================================';
END $$;

-- Liste des tables CRM attendues
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
        THEN '✅ EXISTE' 
        ELSE '❌ MANQUANTE' 
    END as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.table_name) as exists_flag
FROM (VALUES 
    ('guests'),
    ('guest_preferences'),
    ('guest_history'),
    ('guest_segments'),
    ('guest_segment_assignments')
) AS t(table_name);

-- =====================================================
-- 2. VÉRIFICATION DES TABLES STAFF
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '2. VÉRIFICATION DES TABLES STAFF';
    RAISE NOTICE '==========================================';
END $$;

SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
        THEN '✅ EXISTE' 
        ELSE '❌ MANQUANTE' 
    END as status
FROM (VALUES 
    ('staff_members'),
    ('staff_schedules'),
    ('staff_tasks'),
    ('staff_leave_requests')
) AS t(table_name);

-- =====================================================
-- 3. VÉRIFICATION DES POLITIQUES RLS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '3. VÉRIFICATION DES POLITIQUES RLS';
    RAISE NOTICE '==========================================';
END $$;

SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    CASE WHEN qual IS NOT NULL THEN '✅' ELSE '⚠️' END as has_condition
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 4. VÉRIFICATION DES CONTRAINTES (CLÉS ÉTRANGÈRES)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '4. VÉRIFICATION DES CONTRAINTES';
    RAISE NOTICE '==========================================';
END $$;

SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN kcu.column_name ELSE NULL END as fk_column,
    CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.table_name ELSE NULL END as references_table
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name 
    AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('guests', 'guest_history', 'staff_members', 'staff_schedules')
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 5. VÉRIFICATION DES DONNÉES (SEED)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '5. VÉRIFICATION DES DONNÉES SEED';
    RAISE NOTICE '==========================================';
END $$;

SELECT 'guests' as table_name, COUNT(*) as row_count FROM guests
UNION ALL
SELECT 'guest_preferences', COUNT(*) FROM guest_preferences
UNION ALL
SELECT 'guest_history', COUNT(*) FROM guest_history
UNION ALL
SELECT 'staff_members', COUNT(*) FROM staff_members
UNION ALL
SELECT 'staff_schedules', COUNT(*) FROM staff_schedules;

-- =====================================================
-- 6. TEST DE LA FONCTION get_current_user_hotel_id
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '6. TEST DE LA FONCTION UTILITAIRE';
    RAISE NOTICE '==========================================';
END $$;

-- Vérifier que la fonction existe
SELECT 
    proname as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_user_hotel_id') 
         THEN '✅ EXISTE' 
         ELSE '❌ MANQUANTE' 
    END as status
FROM pg_proc 
WHERE proname = 'get_current_user_hotel_id'
UNION ALL
SELECT 'get_current_user_hotel_id' as function_name, '⚠️ NON TESTABLE SANS AUTH' as status
LIMIT 1;

-- =====================================================
-- 7. RÉSUMÉ FINAL
-- =====================================================

DO $$
DECLARE
    tables_ok INT;
    policies_ok INT;
BEGIN
    SELECT COUNT(*) INTO tables_ok 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_name IN ('guests', 'guest_preferences', 'guest_history', 'guest_segments', 
                          'staff_members', 'staff_schedules', 'staff_tasks', 'staff_leave_requests');
    
    SELECT COUNT(*) INTO policies_ok 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE '📊 RÉSUMÉ FINAL';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Tables CRM/Staff créées : %/8', tables_ok;
    RAISE NOTICE 'Politiques RLS actives : %', policies_ok;
    
    IF tables_ok = 8 THEN
        RAISE NOTICE '✅ MIGRATION CRM/STAFF : RÉUSSIE';
    ELSE
        RAISE NOTICE '⚠️ MIGRATION CRM/STAFF : INCOMPLÈTE';
    END IF;
    
    IF policies_ok > 0 THEN
        RAISE NOTICE '✅ POLITIQUES RLS : ACTIVES';
    ELSE
        RAISE NOTICE '⚠️ POLITIQUES RLS : AUCUNE TROUVÉE';
    END IF;
END $$;