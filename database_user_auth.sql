-- Script para adicionar autenticação de utilizadores (clientes)
-- Executar no SQL Server Management Studio (SSMS)

-- 1. Adicionar coluna de palavra-passe à tabela Clientes
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
GO

-- 2. Garantir que a coluna email na tabela Clientes é única (para login)
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
GO

-- 3. Verificar estrutura atual da tabela Clientes
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Clientes'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '✅ Sistema de autenticação de utilizadores pronto!';
PRINT '📝 Para testar, pode inserir um cliente com palavra-passe:';
PRINT 'INSERT INTO Clientes (nome_cliente, email, telefone, palavra_passe) VALUES';
PRINT '(''João Silva'', ''joao.silva@email.com'', ''912345678'', ''senha123'');';
