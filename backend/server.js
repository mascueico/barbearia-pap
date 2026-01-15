/**
 * server.js — Backend (Node.js + Express + SQL Server)
 * ✅ Windows Authentication (SSMS usa Windows Auth)
 * ✅ ODBC Driver 17 (via connectionString)
 *
 * Rotas:
 *  GET  /                     -> teste
 *  POST /login                -> login admin (email + palavra_passe)
 *  GET  /servicos             -> listar serviços
 *  GET  /funcionarios         -> listar funcionários
 *  GET  /agendamentos         -> listar agendamentos (JOIN + data/hora)
 *  POST /agendamentos         -> criar agendamento (com bloqueio de horário)
 *  PUT  /agendamentos/:id/status -> alterar status (Confirmado/Cancelado/Pendente)
 */

const express = require("express");
const cors = require("cors");

// IMPORTANTE: msnodesqlv8 para Windows Auth
const sql = require("mssql/msnodesqlv8");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/**
 * ✅ Ligações Windows Auth via ODBC Driver 17
 * - Troca só o Database para o nome real da tua BD se for diferente
 * - Se o teu servidor tiver instância (ex: \SQLEXPRESS), mete:
 *   Server=ERCERC-VKKKCOPK\\SQLEXPRESS
 */
const dbConfig = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;",
  options: {
    trustServerCertificate: true,
  },
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
 * LOGIN ADMIN (Back-office)
 * =========================
 * Tabela: Administradores
 * Colunas: email, palavra_passe, nome
 * Aceita body:
 *  - { email, password } OU { email, palavra_passe }
 */
app.post("/login", async (req, res) => {
  try {
    const { email, password, palavra_passe } = req.body;
    const pass = password ?? palavra_passe;

    if (!email || !pass) {
      return res.status(400).json({ erro: "Faltam credenciais" });
    }

    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .input("pass", sql.NVarChar, pass)
      .query(`
        SELECT id_admin, nome
        FROM Administradores
        WHERE email = @email AND palavra_passe = @pass
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ erro: "Email ou palavra-passe incorretos" });
    }

    return res.json({ ok: true, admin: result.recordset[0].nome });
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
 * GET /agendamentos
 */
app.get("/agendamentos", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT
        a.id_agendamentos,
        c.nome_cliente  AS cliente,
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
      ORDER BY a.data_hora_agendamento DESC
    `);

    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * ======================
 * CRIAR AGENDAMENTO
 * ======================
 * POST /agendamentos
 * body:
 * {
 *   id_cliente, id_funcionario, id_servico,
 *   data: "YYYY-MM-DD",
 *   hora: "HH:MM",
 *   observacoes: "..."
 * }
 *
 * ✅ Bloqueia se já houver agendamento para o mesmo funcionário na mesma data/hora
 * (ignorando status = Cancelado)
 */
app.post("/agendamentos", async (req, res) => {
  try {
    const { id_cliente, id_funcionario, id_servico, data, hora, observacoes } =
      req.body;

    if (!id_cliente || !id_funcionario || !id_servico || !data || !hora) {
      return res.status(400).json({ erro: "Faltam dados obrigatórios" });
    }

    // Cria DateTime a partir de data+hora
    const dataHoraStr = `${data}T${hora}:00`;
    const dataHora = new Date(dataHoraStr);

    if (isNaN(dataHora.getTime())) {
      return res.status(400).json({ erro: "Data/Hora inválidas" });
    }

    // 1) Verifica conflito (mesmo funcionário + mesmo datetime), ignorando cancelados
    const check = await pool
      .request()
      .input("id_funcionario", sql.Int, id_funcionario)
      .input("dataHora", sql.DateTime, dataHora)
      .query(`
        SELECT COUNT(*) AS total
        FROM Agendamentos
        WHERE id_funcionario = @id_funcionario
          AND data_hora_agendamento = @dataHora
          AND (status IS NULL OR status <> 'Cancelado')
      `);

    const total = check.recordset[0].total;

    if (total > 0) {
      return res.status(409).json({
        erro: "Horário indisponível: o funcionário já tem um agendamento nesse horário.",
      });
    }

    // 2) Insere agendamento (por defeito Pendente)
    await pool
      .request()
      .input("id_cliente", sql.Int, id_cliente)
      .input("id_funcionario", sql.Int, id_funcionario)
      .input("id_servico", sql.Int, id_servico)
      .input("dataHora", sql.DateTime, dataHora)
      .input("status", sql.VarChar, "Pendente")
      .input("observacoes", sql.VarChar, observacoes ?? null)
      .query(`
        INSERT INTO Agendamentos
          (id_cliente, id_funcionario, id_servico, data_hora_agendamento, status, observacoes)
        VALUES
          (@id_cliente, @id_funcionario, @id_servico, @dataHora, @status, @observacoes)
      `);

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

/**
 * ==================================
 * ATUALIZAR STATUS DO AGENDAMENTO
 * ==================================
 * PUT /agendamentos/:id/status
 * body: { status: "Confirmado" | "Cancelado" | "Pendente" }
 */
app.put("/agendamentos/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    const allowed = ["Pendente", "Confirmado", "Cancelado"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ erro: "Status inválido" });
    }

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("status", sql.VarChar, status)
      .query(`
        UPDATE Agendamentos
        SET status = @status
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

/** Arranca o servidor */
app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr em http://localhost:${PORT}`);
});
