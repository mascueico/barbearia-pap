/**
 * server.js — Backend (Node.js + Express + SQL Server)
 * ✅ Windows Authentication (SSMS usa Windows Auth)
 * ✅ ODBC Driver 17
 *
 * ✅ Serve o frontend:
 * - http://localhost:3000/marcar.html
 * - http://localhost:3000/js/marcar.js
 * - (ALIAS) http://localhost:3000/frontend/js/marcar.js  <-- para não falhar mais
 *
 * Rotas:
 *  GET  /                     -> teste
 *  GET  /__debug              -> debug do frontendPath
 *  POST /login                -> login admin
 *  GET  /servicos             -> listar serviços
 *  GET  /funcionarios         -> listar funcionários
 *  GET  /agendamentos         -> listar agendamentos
 *  POST /agendamentos         -> criar agendamento (com bloqueio)
 *  PUT  /agendamentos/:id/status -> alterar status
 *  DELETE /agendamentos/:id   -> apagar agendamento
 *  GET  /horarios-disponiveis -> horários disponíveis (usa tabela Horario)
 *  POST /clientes             -> criar/obter cliente
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

// IMPORTANTE: msnodesqlv8 para Windows Auth
const sql = require("mssql/msnodesqlv8");

// Importar serviço de email
const emailService = require("./emailService");

// Função para hash de palavras-passe
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Função para comparar palavras-passe
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const app = express();
const PORT = 3000;

app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000']
}));
app.use(express.json());

/**
 * ✅ Servir o frontend
 * Estrutura esperada:
 * BARBEARIA-PAP/
 *   backend/server.js
 *   frontend/marcar.html
 *   frontend/js/marcar.js
 */
const frontendPath = path.resolve(__dirname, "..", "frontend");
console.log("📁 A servir frontend de:", frontendPath);

// Serve como raiz: /marcar.html, /js/marcar.js, etc.
app.use(express.static(frontendPath));

// ✅ ALIAS CRÍTICO: também servir em /frontend (para o teu caso atual)
app.use("/frontend", express.static(frontendPath));

app.get("/__debug", (req, res) => {
  res.json({
    ok: true,
    frontendPath,
    exists: fs.existsSync(frontendPath),
  });
});

/**
 * ✅ Config BD (Windows Auth via ODBC Driver 17)
 * Se tiver instância (ex: \SQLEXPRESS):
 * Server=ERCERC-VKKKCOPK\\SQLEXPRESS
 */
const dbConfig = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;",
  options: { trustServerCertificate: true },
};

let pool;

// Liga à BD
async function initDb() {
  try {
    pool = await sql.connect(dbConfig);
    console.log("✅ Ligado ao SQL Server (Windows Auth)");
  } catch (err) {
    console.error("❌ Erro ao ligar à BD:", err.message);
  }
}
initDb();

/** Rota de teste */
app.get("/", (req, res) => {
  res.send("API Barbearia a funcionar ✅");
});

/**
 * =========================
 * LOGIN ADMIN
 * =========================
 */
app.post("/login", async (req, res) => {
  try {
    const { email, password, palavra_passe } = req.body;
    const pass = password ?? palavra_passe;

    if (!email || !pass) {
      return res.status(400).json({ erro: "Faltam credenciais" });
    }

    // Obter admin com email
    const result = await pool
      .request()
      .input("email", sql.NVarChar(255), email)
      .query(`
        SELECT id_admin, nome, palavra_passe
        FROM Administradores
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ erro: "Email ou palavra-passe incorretos" });
    }

    // Verificar palavra-passe
    const admin = result.recordset[0];
    const isPasswordValid = await comparePassword(pass, admin.palavra_passe);

    if (!isPasswordValid) {
      return res.status(401).json({ erro: "Email ou palavra-passe incorretos" });
    }

    return res.json({ ok: true, admin: admin.nome });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * =========================
 * REGISTO DE UTILIZADOR (CLIENTE)
 * =========================
 */
app.post("/register", async (req, res) => {
  try {
    const { nome, email, telefone, palavra_passe, senha } = req.body;
    const pass = palavra_passe ?? senha;

    if (!nome || !email || !telefone || !pass) {
      return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
    }

    // Verificar se o email já existe
    const existingUser = await pool
      .request()
      .input("email", sql.NVarChar(255), email)
      .query(`
        SELECT id_cliente
        FROM Clientes
        WHERE email = @email
      `);

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ erro: "Email já registrado" });
    }

    // Verificar se a coluna palavra_passe existe na tabela Clientes
    const checkColumnResult = await pool.request().query(`
      SELECT COUNT(*) AS columnCount
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Clientes' AND COLUMN_NAME = 'palavra_passe'
    `);

    const hasPalavraPasseColumn = checkColumnResult.recordset[0].columnCount > 0;

    let query;
    if (hasPalavraPasseColumn) {
      query = `
        INSERT INTO Clientes (nome_cliente, email, telefone, palavra_passe)
        OUTPUT INSERTED.id_cliente, INSERTED.nome_cliente, INSERTED.email
        VALUES (@nome, @email, @telefone, @pass)
      `;
    } else {
      query = `
        INSERT INTO Clientes (nome_cliente, email, telefone, senha)
        OUTPUT INSERTED.id_cliente, INSERTED.nome_cliente, INSERTED.email
        VALUES (@nome, @email, @telefone, @pass)
      `;
    }

    // Hash da palavra-passe
    const hashedPassword = await hashPassword(pass);

    // Criar novo cliente
    const result = await pool
      .request()
      .input("nome", sql.NVarChar(255), nome)
      .input("email", sql.NVarChar(255), email)
      .input("telefone", sql.NVarChar(20), telefone)
      .input("pass", sql.NVarChar(255), hashedPassword)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(500).json({ erro: "Erro ao criar utilizador" });
    }

    const newUser = result.recordset[0];
    return res.json({ 
      ok: true, 
      cliente: {
        id_cliente: newUser.id_cliente,
        nome_cliente: newUser.nome_cliente,
        email: newUser.email
      }
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * =========================
 * LOGIN DE UTILIZADOR (CLIENTE)
 * =========================
 */
app.post("/cliente/login", async (req, res) => {
  try {
    const { email, password, palavra_passe, senha } = req.body;
    const pass = password ?? palavra_passe ?? senha;

    if (!email || !pass) {
      return res.status(400).json({ erro: "Faltam credenciais" });
    }

    // Verificar se a coluna palavra_passe existe na tabela Clientes
    const checkColumnResult = await pool.request().query(`
      SELECT COUNT(*) AS columnCount
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Clientes' AND COLUMN_NAME = 'palavra_passe'
    `);

    const hasPalavraPasseColumn = checkColumnResult.recordset[0].columnCount > 0;

    let query;
    if (hasPalavraPasseColumn) {
      query = `
        SELECT id_cliente, nome_cliente, email, telefone, palavra_passe
        FROM Clientes
        WHERE email = @email
      `;
    } else {
      query = `
        SELECT id_cliente, nome_cliente, email, telefone, senha
        FROM Clientes
        WHERE email = @email
      `;
    }

    const result = await pool
      .request()
      .input("email", sql.NVarChar(255), email)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(401).json({ erro: "Email ou palavra-passe incorretos" });
    }

    // Verificar palavra-passe
    const cliente = result.recordset[0];
    const storedPassword = hasPalavraPasseColumn ? cliente.palavra_passe : cliente.senha;
    const isPasswordValid = await comparePassword(pass, storedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ erro: "Email ou palavra-passe incorretos" });
    }

    // Remover a palavra-passe do objeto a enviar ao frontend
    const { palavra_passe: _, senha: __, ...clienteWithoutPassword } = cliente;

    return res.json({ 
      ok: true, 
      cliente: clienteWithoutPassword
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * ======================
 * LISTAR SERVIÇOS
 * ======================
 */
app.get("/servicos", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT id_servico, nome_servico, preco, duracao_estimada, descricao
      FROM Servicos
      ORDER BY nome_servico
    `);

    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * =========================
 * LISTAR FUNCIONÁRIOS
 * =========================
 */
app.get("/funcionarios", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT id_funcionario, nome_completo, especialidade, email, telefone
      FROM Funcionarios
      ORDER BY nome_completo
    `);

    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * ======================
 * LISTAR AGENDAMENTOS
 * ======================
 */
app.get("/agendamentos", async (req, res) => {
  try {
    const { cliente } = req.query;
    
    let query = `
      SELECT
        a.id_agendamentos,
        c.nome_cliente  AS cliente,
        c.telefone      AS telefone,
        f.nome_completo AS funcionario,
        s.nome_servico  AS servico,
        CONVERT(date, a.data_hora_agendamento) AS data_agendamento,
        CONVERT(varchar(5), a.data_hora_agendamento, 108) AS hora,
        a.status,
        a.observacoes
      FROM Agendamentos a
      JOIN Clientes c ON a.id_cliente = c.id_cliente
      JOIN Funcionarios f ON a.id_funcionario = f.id_funcionario
      JOIN Servicos s ON a.id_servico = s.id_servico
    `;
    
    const request = pool.request();
    
    if (cliente) {
      query += ` WHERE a.id_cliente = @cliente`;
      request.input("cliente", sql.Int, parseInt(cliente));
    }
    
    query += ` ORDER BY a.data_hora_agendamento DESC`;
    
    const result = await request.query(query);

    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * ======================
 * CRIAR AGENDAMENTO
 * ======================
 */
app.post("/agendamentos", async (req, res) => {
  try {
    const { id_cliente, id_funcionario, id_servico, data, hora, observacoes } = req.body;

    if (!id_cliente || !id_funcionario || !id_servico || !data || !hora) {
      return res.status(400).json({ erro: "Faltam dados obrigatórios" });
    }

    const inicioStr = `${data}T${hora}:00`;
    const inicioNovo = new Date(inicioStr);
    if (isNaN(inicioNovo.getTime())) {
      return res.status(400).json({ erro: "Data/Hora inválidas" });
    }

    // Check if booking time is in the past
    const now = new Date();
    const [year, month, day] = data.split('-').map(Number);
    const bookingDate = new Date(Date.UTC(year, month - 1, day));
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    console.log('=== Date Validation ===');
    console.log('Data string:', data);
    console.log('Parsed booking date:', bookingDate);
    console.log('Today:', today);
    console.log('Booking date < Today:', bookingDate < today);
    
    // Check if the booking date is in the past
    if (bookingDate < today) {
      console.log('Rejecting past date:', data);
      return res.status(400).json({ erro: "Não pode marcar para uma data passada" });
    }
    
    // Check if the booking time is in the past on the same day
    if (bookingDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
      const [bookHours, bookMinutes] = hora.split(':').map(Number);
      const nowHours = now.getUTCHours();
      const nowMinutes = now.getUTCMinutes();
      
      console.log('=== Time Validation ===');
      console.log('Booking time:', `${bookHours}:${bookMinutes}`);
      console.log('Current time:', `${nowHours}:${nowMinutes}`);
      
      if (bookHours < nowHours || (bookHours === nowHours && bookMinutes < nowMinutes)) {
        console.log('Rejecting past time:', `${bookHours}:${bookMinutes}`);
        return res.status(400).json({ erro: "Não pode marcar para um horário passado" });
      }
    }

    // duração do serviço
    const serv = await pool
      .request()
      .input("id_servico", sql.Int, id_servico)
      .query(`
        SELECT ISNULL(duracao_estimada, 30) AS duracao_estimada
        FROM Servicos
        WHERE id_servico = @id_servico
      `);

    if (serv.recordset.length === 0) {
      return res.status(400).json({ erro: "Serviço inválido" });
    }

    let duracaoMin = parseInt(serv.recordset[0].duracao_estimada, 10);
    if (isNaN(duracaoMin) || duracaoMin <= 0) duracaoMin = 30;

    const fimNovo = new Date(inicioNovo.getTime() + duracaoMin * 60000);

    // existentes no mesmo dia (não cancelados)
    const existentes = await pool
      .request()
      .input("id_funcionario", sql.Int, id_funcionario)
      .input("data", sql.VarChar(10), data) // evita tretas de timezone
      .query(`
        SELECT
          a.data_hora_agendamento AS inicio,
          ISNULL(s.duracao_estimada, 30) AS duracao
        FROM Agendamentos a
        JOIN Servicos s ON a.id_servico = s.id_servico
        WHERE a.id_funcionario = @id_funcionario
          AND CONVERT(date, a.data_hora_agendamento) = @data
          AND (a.status IS NULL OR a.status <> 'Cancelado')
      `);

    function sobrepoe(aIni, aFim, bIni, bFim) {
      return aIni < bFim && aFim > bIni;
    }

    for (const r of existentes.recordset) {
      const ini = new Date(r.inicio);
      const dur = parseInt(r.duracao, 10) || 30;
      const fim = new Date(ini.getTime() + dur * 60000);

      if (sobrepoe(inicioNovo, fimNovo, ini, fim)) {
        return res.status(409).json({
          erro: "Horário indisponível: existe um agendamento que se sobrepõe a este intervalo.",
        });
      }
    }

    // Obter dados do cliente para email
    const clienteData = await pool
      .request()
      .input("id_cliente", sql.Int, id_cliente)
      .query(`SELECT nome_cliente, email FROM Clientes WHERE id_cliente = @id_cliente`);

    // Obter dados do funcionário para email
    const funcData = await pool
      .request()
      .input("id_funcionario", sql.Int, id_funcionario)
      .query(`SELECT nome_completo, email AS email_funcionario FROM Funcionarios WHERE id_funcionario = @id_funcionario`);

    // Obter dados do serviço
    const servicoData = await pool
      .request()
      .input("id_servico", sql.Int, id_servico)
      .query(`SELECT nome_servico FROM Servicos WHERE id_servico = @id_servico`);

    const cliente = clienteData.recordset[0];
    const funcionario = funcData.recordset[0];
    const servico = servicoData.recordset[0];

    // Criar agendamento
    const result = await pool
      .request()
      .input("id_cliente", sql.Int, id_cliente)
      .input("id_funcionario", sql.Int, id_funcionario)
      .input("id_servico", sql.Int, id_servico)
      .input("dataHora", sql.DateTime, inicioNovo)
      .input("status", sql.VarChar(20), "Pendente")
      .input("observacoes", sql.VarChar(500), observacoes ?? null)
      .query(`
        INSERT INTO Agendamentos
          (id_cliente, id_funcionario, id_servico, data_hora_agendamento, status, observacoes)
        OUTPUT INSERTED.id_agendamentos
        VALUES
          (@id_cliente, @id_funcionario, @id_servico, @dataHora, @status, @observacoes)
      `);

    const id_agendamento = result.recordset[0].id_agendamentos;

    // Enviar email de confirmação pendente ao cliente
    if (cliente?.email) {
      try {
        await emailService.sendPendingConfirmationEmail(cliente.email, cliente.nome_cliente, {
          data: new Date(data).toLocaleDateString("pt-PT"),
          hora: hora,
          servico: servico?.nome_servico,
          funcionario: funcionario?.nome_completo,
        });
        console.log(`✅ Email pendente enviado para ${cliente.email}`);
      } catch (emailErr) {
        console.error(`❌ Erro ao enviar email para cliente:`, emailErr.message);
      }
    }

    // Enviar notificação ao barbeiro (sempre para barbeariaflokiko@gmail.com)
    const barbeiroEmail = "barbeariaflokiko@gmail.com";
    const barbeiroNome = "Equipe Barbearia Flokiko";
    try {
      await emailService.sendBarberNotificationEmail(barbeiroEmail, barbeiroNome, {
        cliente: cliente?.nome_cliente,
        data: new Date(data).toLocaleDateString("pt-PT"),
        hora: hora,
        servico: servico?.nome_servico,
        observacoes: observacoes,
      });
      console.log(`✅ Email de notificação enviado para barbeiro ${barbeiroEmail}`);
    } catch (emailErr) {
      console.error(`❌ Erro ao enviar email para barbeiro:`, emailErr.message);
    }

    return res.json({ ok: true, id_agendamento });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * ==========================
 * ATUALIZAR STATUS
 * ==========================
 */
app.put("/agendamentos/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    const allowed = ["Confirmado", "Cancelado"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ erro: "Status inválido" });
    }

    // Obter dados do agendamento antes de atualizar
    const agendamentoData = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT a.*, c.nome_cliente, c.email, f.nome_completo AS funcionario_nome, s.nome_servico
        FROM Agendamentos a
        JOIN Clientes c ON a.id_cliente = c.id_cliente
        JOIN Funcionarios f ON a.id_funcionario = f.id_funcionario
        JOIN Servicos s ON a.id_servico = s.id_servico
        WHERE a.id_agendamentos = @id
      `);

    if (agendamentoData.recordset.length === 0) {
      return res.status(404).json({ erro: "Agendamento não encontrado" });
    }

    const agendamento = agendamentoData.recordset[0];
    const statusAnterior = agendamento.status;

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("status", sql.VarChar(20), status)
      .query(`
        UPDATE Agendamentos
        SET status = @status
        WHERE id_agendamentos = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ erro: "Agendamento não encontrado" });
    }

    // Enviar email conforme o novo status
    if (agendamento.email) {
      const emailData = {
        data: new Date(agendamento.data_hora_agendamento).toLocaleDateString("pt-PT"),
        hora: new Date(agendamento.data_hora_agendamento).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
        servico: agendamento.nome_servico,
        funcionario: agendamento.funcionario_nome,
      };

      try {
        if (status === "Confirmado") {
          await emailService.sendConfirmedEmail(agendamento.email, agendamento.nome_cliente, emailData);
          console.log(`✅ Email de confirmação enviado para ${agendamento.email}`);
        } else if (status === "Cancelado" && statusAnterior !== "Cancelado") {
          await emailService.sendCancellationEmail(agendamento.email, agendamento.nome_cliente, emailData);
          console.log(`✅ Email de cancelamento enviado para ${agendamento.email}`);
        }
      } catch (emailErr) {
        console.error(`❌ Erro ao enviar email de status:`, emailErr.message);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * ==========================
 * APAGAR AGENDAMENTO
 * ==========================
 */
app.delete("/agendamentos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM Agendamentos
        WHERE id_agendamentos = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ erro: "Agendamento não encontrado" });
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * ==========================
 * HORÁRIOS DISPONÍVEIS
 * ==========================
 * /horarios-disponiveis?id_funcionario=1&data=2026-01-14&id_servico=2
 */
// ✅ HORÁRIOS DISPONÍVEIS (slots de 30 min, duração depende do serviço)
// Exemplo: /horarios-disponiveis?id_funcionario=3&data=2026-02-05&id_servico=1
app.get("/horarios-disponiveis", async (req, res) => {
  try {
    const id_funcionario = parseInt(req.query.id_funcionario, 10);
    const data = req.query.data; // "YYYY-MM-DD"
    const id_servico = req.query.id_servico ? parseInt(req.query.id_servico, 10) : null;

    if (!id_funcionario || !data) {
      return res.status(400).json({ erro: "Faltam parâmetros: id_funcionario e data" });
    }

    /* ==========================
       1) Duração do serviço
    ========================== */
    let duracaoMin = 30;

    if (id_servico) {
      const serv = await pool.request()
        .input("id_servico", sql.Int, id_servico)
        .query(`
          SELECT duracao_estimada
          FROM Servicos
          WHERE id_servico = @id_servico
        `);

      if (serv.recordset.length > 0 && serv.recordset[0].duracao_estimada != null) {
        duracaoMin = parseInt(serv.recordset[0].duracao_estimada, 10);
        if (isNaN(duracaoMin) || duracaoMin <= 0) duracaoMin = 30;
      }
    }

    /* ==========================
       2) Agendamentos ocupados
    ========================== */
    const ags = await pool.request()
      .input("id_funcionario", sql.Int, id_funcionario)
      .input("data", sql.VarChar(10), data)
      .query(`
        SELECT
          a.data_hora_agendamento AS inicio,
          ISNULL(s.duracao_estimada, 30) AS duracao
        FROM Agendamentos a
        JOIN Servicos s ON a.id_servico = s.id_servico
        WHERE a.id_funcionario = @id_funcionario
          AND CONVERT(date, a.data_hora_agendamento) = @data
          AND (a.status IS NULL OR a.status <> 'Cancelado')
      `);

    const ocupados = ags.recordset.map(r => {
      const ini = new Date(r.inicio);
      const fim = new Date(ini.getTime() + (parseInt(r.duracao, 10) || 30) * 60000);
      return { ini, fim };
    });

    function sobrepoe(aIni, aFim, bIni, bFim) {
      return aIni < bFim && aFim > bIni;
    }

    /* ==========================
       3) Horário do funcionário (tabela Horario)
       dia_semana: 1=Seg ... 7=Dom
    ========================== */
    const d = new Date(`${data}T00:00:00`);
    let diaSemana = d.getDay(); // 0=Dom ... 6=Sáb
    diaSemana = diaSemana === 0 ? 7 : diaSemana;

    // Usar a tabela Horario para obter o horário do funcionário
    const hor = await pool.request()
      .input("id_funcionario", sql.Int, id_funcionario)
      .input("dia_semana", sql.TinyInt, diaSemana)
      .query(`
        SELECT TOP 1
          CONVERT(varchar(5), hora_inicio, 108) AS hora_inicio,
          CONVERT(varchar(5), hora_fim, 108)   AS hora_fim
        FROM Horario
        WHERE id_funcionario = @id_funcionario
          AND dia_semana = @dia_semana
      `);

    if (hor.recordset.length === 0) {
      return res.json({ id_funcionario, data, duracaoMin, horarios: [] });
    }

    const HORA_ABERTURA = hor.recordset[0].hora_inicio; // "HH:MM"
    const HORA_FECHO = hor.recordset[0].hora_fim;       // "HH:MM"

    /* ==========================
       4) Gerar slots de 30 min (:00 e :30)
    ========================== */
    function dateAt(hhmm) {
      return new Date(`${data}T${hhmm}:00`);
    }

    function roundUpToStep(dateObj, stepMin) {
      const x = new Date(dateObj);
      x.setSeconds(0, 0);
      const m = x.getMinutes();
      const mod = m % stepMin;
      if (mod !== 0) x.setMinutes(m + (stepMin - mod));
      return x;
    }

    const STEP_MIN = 30;
    const inicioDia = dateAt(HORA_ABERTURA);
    const fimDia = dateAt(HORA_FECHO);

    let t = roundUpToStep(inicioDia, STEP_MIN);

    const agora = new Date();
    const horaMinima = new Date(agora.getTime() + 60 * 60 * 1000); // +1 hora
    const hojeStr = agora.toISOString().slice(0, 10);

    const disponiveis = [];

    for (
      ; t.getTime() + duracaoMin * 60000 <= fimDia.getTime();
      t = new Date(t.getTime() + STEP_MIN * 60000)
    ) {
      const tFim = new Date(t.getTime() + duracaoMin * 60000);

       // se for hoje, não sugerir horários menos de 1 hora depois da hora atual
       if (data === hojeStr && t < horaMinima) continue;

      // conflitos
      const choca = ocupados.some(o => sobrepoe(t, tFim, o.ini, o.fim));
      if (!choca) {
        const hh = String(t.getHours()).padStart(2, "0");
        const mm = String(t.getMinutes()).padStart(2, "0");
        disponiveis.push(`${hh}:${mm}`);
      }
    }

    return res.json({
      id_funcionario,
      data,
      duracaoMin,
      horarios: disponiveis
    });

  } catch (err) {
    console.error("Erro /horarios-disponiveis:", err);
    return res.status(500).json({ erro: err.message });
  }
});


/**
 * ==========================
 * AGENDAR LEMRETES (Scheduler)
 * ==========================
 * Verifica a cada hora se há agendamentos confirmados nas próximas 24h
 */
function iniciarSchedulerLembretes() {
  const INTERVALO_MINUTOS = 60; // verificar a cada hora
  const HORAS_ANTES = parseInt(process.env.REMINDER_HOURS_BEFORE, 10) || 24;

  async function verificarLembretes() {
    try {
      if (!pool) {
        console.log("⏰ Pool de ligação não está pronto, aguardando...");
        return;
      }

      const agora = new Date();
      const limite = new Date(agora.getTime() + HORAS_ANTES * 60 * 60 * 1000);

      // Buscar agendamentos confirmados nas próximas X horas que ainda não receberam lembrete
      const agendamentos = await pool
        .request()
        .input("limite", sql.DateTime, limite)
        .query(`
          SELECT TOP 10
            a.id_agendamentos,
            c.nome_cliente,
            c.email,
            f.nome_completo AS funcionario,
            s.nome_servico,
            a.data_hora_agendamento,
            a.lembrete_enviado
          FROM Agendamentos a
          JOIN Clientes c ON a.id_cliente = c.id_cliente
          JOIN Funcionarios f ON a.id_funcionario = f.id_funcionario
          JOIN Servicos s ON a.id_servico = s.id_servico
          WHERE a.status = 'Confirmado'
            AND a.lembrete_enviado IS NULL
            AND a.data_hora_agendamento BETWEEN GETDATE() AND @limite
          ORDER BY a.data_hora_agendamento ASC
        `);

      if (agendamentos.recordset.length === 0) {
        return;
      }

      console.log(`📧 A enviar ${agendamentos.recordset.length} lembretes...`);

      for (const ag of agendamentos.recordset) {
        try {
          const dataAgendamento = new Date(ag.data_hora_agendamento);
          const horasRestantes = Math.round((dataAgendamento - agora) / (1000 * 60 * 60));

          await emailService.sendReminderEmail(ag.email, ag.nome_cliente, {
            data: dataAgendamento.toLocaleDateString("pt-PT"),
            hora: dataAgendamento.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }),
            servico: ag.nome_servico,
            funcionario: ag.funcionario,
          }, horasRestantes);

          // Marcar como enviado
          await pool
            .request()
            .input("id", sql.Int, ag.id_agendamentos)
            .query(`UPDATE Agendamentos SET lembrete_enviado = GETDATE() WHERE id_agendamentos = @id`);

          console.log(`✅ Lembrete enviado para ${ag.email}`);
        } catch (err) {
          console.error(`❌ Erro ao enviar lembrete para ${ag.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error("❌ Erro no scheduler de lembretes:", err.message);
    }
  }

  // Executar imediatamente na inicialização
  verificarLembretes();

  // Executar a cada intervalo
  setInterval(verificarLembretes, INTERVALO_MINUTOS * 60 * 1000);
}

/**
 * ==========================
 * AGENDAR / ACTUALIZAR CLIENTE
 * ==========================
 */
app.post("/clientes", async (req, res) => {
  try {
    console.log('Received /clientes request:', req.body);

    const { nome, telefone, email } = req.body;

    if (!nome || !telefone) {
      return res.status(400).json({ erro: "Faltam dados do cliente (nome/telefone)" });
    }

    let existe = null;

    // Verificar cliente por telefone
    existe = await pool
      .request()
      .input("telefone", sql.VarChar(30), telefone)
      .query(`
        SELECT TOP 1 id_cliente, nome_cliente, email
        FROM Clientes
        WHERE telefone = @telefone
      `);

    console.log('Client exists by phone result:', existe.recordset);

    if (existe.recordset.length === 0 && email) {
      // Verificar cliente por email
      existe = await pool
        .request()
        .input("email", sql.VarChar(150), email)
        .query(`
          SELECT TOP 1 id_cliente, nome_cliente, email
          FROM Clientes
          WHERE email = @email
        `);

      console.log('Client exists by email result:', existe.recordset);
    }

    if (existe.recordset.length > 0) {
      // Atualizar email se fornecido
      if (email) {
        await pool
          .request()
          .input("id_cliente", sql.Int, existe.recordset[0].id_cliente)
          .input("email", sql.VarChar(150), email)
          .query(`UPDATE Clientes SET email = @email WHERE id_cliente = @id_cliente`);
      }
      return res.json({ ok: true, id_cliente: existe.recordset[0].id_cliente });
    }

    // email/palavra_passe temporários (podes trocar por registo real depois)
    const emailGerado = email || `cliente_${telefone.replace(/\s+/g, "")}@pap.local`;
    const palavra_passe = `temp_${Math.random().toString(36).slice(2, 10)}`;

    const criado = await pool
      .request()
      .input("nome", sql.VarChar(150), nome)
      .input("email", sql.VarChar(150), emailGerado)
      .input("telefone", sql.VarChar(30), telefone)
      .input("palavra_passe", sql.VarChar(255), palavra_passe)
      .query(`
        INSERT INTO Clientes (nome_cliente, email, telefone, data_registo, palavra_passe)
        OUTPUT INSERTED.id_cliente
        VALUES (@nome, @email, @telefone, GETDATE(), @palavra_passe)
      `);

    console.log('Client created:', criado.recordset);

    return res.json({ ok: true, id_cliente: criado.recordset[0].id_cliente });
  } catch (err) {
    console.error('Error in /clientes endpoint:', err);
    return res.status(500).json({ erro: err.message });
  }
});

/** Arranca o servidor */
app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr em http://localhost:${PORT}`);
  console.log(`➡️ Frontend: http://localhost:${PORT}/marcar.html`);
});

// Iniciar scheduler de lembretes APÓS a ligação à BD
async function initSchedulerAfterDB() {
  const INTERVALO_MINUTOS = 60;
  const HORAS_ANTES = parseInt(process.env.REMINDER_HOURS_BEFORE, 10) || 24;
  
  // Esperar que o pool esteja pronto
  while (!pool) {
    console.log("⏰ Aguardando ligação à BD...");
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log(`⏰ Scheduler de lembretes iniciado (${HORAS_ANTES}h antes)`);
  iniciarSchedulerLembretes();
}

// Iniciar scheduler após um delay seguro
setTimeout(initSchedulerAfterDB, 5000);