# Sistema de Emails - Barbearia PAP

## Funcionalidades Implementadas

O sistema de emails inclui as seguintes funcionalidades:

1. **Email de Confirmação Pendente** - Enviado ao cliente quando marca um horário
2. **Email de Confirmação** - Enviado ao cliente quando o administrador confirma o agendamento
3. **Email de Cancelamento** - Enviado ao cliente quando o agendamento é cancelado
4. **Email de Lembrete** - Enviado automaticamente 24h antes do agendamento
5. **Notificação ao Barbeiro** - Enviado ao barbeiro quando um cliente marca horário

## Configuração

### 1. Credenciais de Email (Gmail)

O sistema usa SMTP do Gmail. Para funcionar, precisas de:

1. **Ativar a Verificação em 2 Passos** na tua conta Google
2. **Criar uma Senha de App**:
   - Acede: https://myaccount.google.com/apppasswords
   - Cria uma senha para "Mail"
   - Usa essa senha no ficheiro `.env`

### 2. Atualizar ficheiro `.env`

Edita o ficheiro `backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=teu-email@gmail.com
EMAIL_PASS=sua-senha-de-app  # Senha de app, não a palavra-passe normal
EMAIL_FROM=Barbearia PAP <teu-email@gmail.com>

# horas antes do agendamento para enviar lembrete
REMINDER_HOURS_BEFORE=24
```

### 3. Atualizar Base de Dados

Executa o script SQL no SSMS:

```sql
-- Executar o ficheiro database_update.sql
```

Ou executa diretamente:

```sql
ALTER TABLE Agendamentos ADD lembrete_enviado DATETIME NULL;
```

### 4. Campos de Email na Base de Dados

**Tabela Clientes**: Precisa de ter a coluna `email`
**Tabela Funcionarios**: Precisa de ter a coluna `email` (para notificações)

Exemplo para adicionar email à tabela Funcionarios (se não existir):

```sql
ALTER TABLE Funcionarios ADD email NVARCHAR(150) NULL;
UPDATE Funcionarios SET email = 'barbeiro1@barbearia.pt' WHERE id_funcionario = 1;
```

## Executar o Sistema

1. **Instalar dependências** (se necessário):
   ```bash
   cd backend
   npm install
   ```

2. **Iniciar o servidor**:
   ```bash
   cd backend
   npm start
   ```

3. **Testar no frontend**:
   - Abre http://localhost:3000/marcar.html
   - Faz uma marcação com um email válido
   - Verifica se recebes o email

## Troubleshooting

### "535, 5.7.8" - Erro de autenticação
- Verifica se a senha de app está correta
- Confirma que a verificação em 2 passos está ativa

### "Connection timeout"
- Verifica o EMAIL_HOST e EMAIL_PORT
- Confirma que não há firewall a bloquear

### Emails não aparecem na pasta de spam
- Adiciona o email à lista de contactos

## Estrutura dos Ficheiros

```
barbearia-pap/
├── backend/
│   ├── .env                    # Configurações (NÃO committing!)
│   ├── emailService.js         # Módulo de envio de emails
│   └── server.js               # API com integração de emails
├── database_update.sql         # Script de atualização da BD
└── frontend/
    ├── marcar.html             # Formulário com campo email
    └── js/marcar.js            # Lógica com email
```
