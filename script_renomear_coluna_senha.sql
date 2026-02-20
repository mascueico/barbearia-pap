-- Script para renomear coluna "senha" para "palavra_passe" na tabela Clientes
-- Execute diretamente no SQL Server Management Studio (SSMS)

-- Verificar se a coluna "senha" existe
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Clientes') AND name = 'senha'
)
BEGIN
    -- Verificar se a coluna "palavra_passe" já existe (para evitar erros)
    IF EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('Clientes') AND name = 'palavra_passe'
    )
    BEGIN
        PRINT 'ℹ️ A coluna palavra_passe já existe na tabela Clientes';
        PRINT 'ℹ️ Verificando se a coluna senha contém dados...';
        
        -- Verificar se a coluna senha tem dados
        DECLARE @Count INT;
        SELECT @Count = COUNT(*) FROM Clientes WHERE senha IS NOT NULL AND senha != '';
        
        IF @Count > 0
        BEGIN
            PRINT '⚠️ A coluna senha contém ' + CAST(@Count AS VARCHAR) + ' registos com dados';
            PRINT '📋 Deseja transferir os dados da coluna senha para palavra_passe?';
            PRINT 'ℹ️ Execute o comando abaixo se quiser transferir os dados:';
            PRINT 'UPDATE Clientes SET palavra_passe = senha WHERE senha IS NOT NULL AND senha != '''';';
        END
        
        -- Remover a coluna senha
        ALTER TABLE Clientes DROP COLUMN senha;
        PRINT '✅ Coluna senha removida da tabela Clientes';
    END
    ELSE
    BEGIN
        -- Renomear a coluna senha para palavra_passe
        EXEC sp_rename 'Clientes.senha', 'palavra_passe', 'COLUMN';
        PRINT '✅ Coluna senha renomeada para palavra_passe na tabela Clientes';
    END
END
ELSE
BEGIN
    PRINT 'ℹ️ A coluna senha não existe na tabela Clientes';
    PRINT 'ℹ️ Verificando estrutura atual da tabela Clientes:';
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
PRINT '✅ Operação concluída com sucesso!';
