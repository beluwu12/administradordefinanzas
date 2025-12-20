-- Script para eliminar todos los usuarios excepto jeremito18@gmail.com
-- Ejecutar en Supabase SQL Editor

-- Primero, obtener el ID del usuario a conservar
DO $$
DECLARE
    keep_user_id TEXT;
BEGIN
    SELECT id INTO keep_user_id FROM "User" WHERE email = 'jeremito18@gmail.com';
    
    IF keep_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario jeremito18@gmail.com no encontrado';
    END IF;
    
    RAISE NOTICE 'Conservando usuario: %', keep_user_id;
    
    -- Eliminar PushSubscriptions de otros usuarios
    DELETE FROM "PushSubscription" WHERE "userId" != keep_user_id;
    RAISE NOTICE 'PushSubscriptions eliminadas';
    
    -- Eliminar Notifications de otros usuarios
    DELETE FROM "Notification" WHERE "userId" != keep_user_id;
    RAISE NOTICE 'Notifications eliminadas';
    
    -- Eliminar GoalMonth de metas de otros usuarios
    DELETE FROM "GoalMonth" WHERE "goalId" IN (
        SELECT id FROM "Goal" WHERE "userId" != keep_user_id
    );
    RAISE NOTICE 'GoalMonths eliminados';
    
    -- Eliminar Goals de otros usuarios
    DELETE FROM "Goal" WHERE "userId" != keep_user_id;
    RAISE NOTICE 'Goals eliminadas';
    
    -- Eliminar FixedExpenses de otros usuarios
    DELETE FROM "FixedExpense" WHERE "userId" != keep_user_id;
    RAISE NOTICE 'FixedExpenses eliminados';
    
    -- Eliminar relación Transaction-Tag de transacciones de otros usuarios
    DELETE FROM "_TagToTransaction" WHERE "B" IN (
        SELECT id FROM "Transaction" WHERE "userId" != keep_user_id
    );
    RAISE NOTICE 'Transaction-Tag relations eliminadas';
    
    -- Eliminar Transactions de otros usuarios
    DELETE FROM "Transaction" WHERE "userId" != keep_user_id;
    RAISE NOTICE 'Transactions eliminadas';
    
    -- Eliminar Tags de otros usuarios
    DELETE FROM "Tag" WHERE "userId" != keep_user_id;
    RAISE NOTICE 'Tags eliminados';
    
    -- Finalmente, eliminar los usuarios
    DELETE FROM "User" WHERE id != keep_user_id;
    RAISE NOTICE 'Usuarios eliminados';
    
    RAISE NOTICE '✅ Limpieza completada. Solo queda el usuario jeremito18@gmail.com';
END $$;

-- Verificar resultado
SELECT id, email, "firstName", "lastName", country FROM "User";
