-- Script para corrigir a tabela Clientes
-- Execute diretamente no SQL Server Management Studio (SSMS)

-- Adicionar coluna de palavra-passe à tabela Clientes
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Clientes') AND name = 'palavra_passe'
)
BEGIN
    ALTER TABLE Clientes ADD palavra_passe NVARCHAR(255) NULL;
    PRINT '✅ Coluna palavra_passe adicionada à tabela Clientes';
END
ELSE
BEGIN
    PRINT 'ℹ️ Coluna palavra_passe já existe';
END

-- Garantir que a coluna email na tabela Clientes é única (para login)
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'UQ_Clientes_Email' AND object_id = OBJECT_ID('Clientes')
)
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT UQ_Clientes_Email UNIQUE (email);
    PRINT '✅ Constrainte única adicionada à coluna email da tabela Clientes';
END
ELSE
BEGIN
    PRINT 'ℹ️ Constrainte única na coluna email já existe';
END

-- Verificar estrutura atual da tabela Clientes
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Clientes'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '✅ Tabela Clientes corrigida com sucesso!';
