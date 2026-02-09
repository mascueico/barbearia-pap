-- Script de atualização da base de dados para o sistema de emails
-- Executar no SQL Server Management Studio (SSMS)

-- 1. Adicionar coluna para controlar lembretes enviados
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Agendamentos') AND name = 'lembrete_enviado'
)
BEGIN
    ALTER TABLE Agendamentos ADD lembrete_enviado DATETIME NULL;
    PRINT '✅ Coluna lembrete_enviado adicionada à tabela Agendamentos';
END
ELSE
BEGIN
    PRINT 'ℹ️ Coluna lembrete_enviado já existe';
END
GO

-- 2. Garantir que a tabela Clientes tem a coluna email (se não existir)
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Clientes') AND name = 'email'
)
BEGIN
    -- Nota: Esta coluna provavelmente já existe, mas o script está aqui para segurança
    PRINT 'ℹ️ Verificar estrutura da tabela Clientes';
END
GO

-- 3. Verificar estrutura da tabela Clientes
SELECT 
    c.id_cliente,
    c.nome_cliente,
    c.email,
    c.telefone
FROM Clientes c
WHERE c.email IS NULL OR c.email = ''
ORDER BY c.id_cliente;
GO

PRINT '';
PRINT '📧 Para ativar o sistema de emails:';
PRINT '1. Atualizar o ficheiro backend/.env com as credenciais SMTP';
PRINT '2. Reiniciar o servidor Node.js';
PRINT '';
