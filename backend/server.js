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
// ✅ CRIAR AGENDAMENTO (com bloqueio por INTERVALO)
app.post("/agendamentos", async (req, res) => {
  try {
    const { id_cliente, id_funcionario, id_servico, data, hora, observacoes } = req.body;

    // 1) Validar dados obrigatórios
    if (!id_cliente || !id_funcionario || !id_servico || !data || !hora) {
      return res.status(400).json({ erro: "Faltam dados obrigatórios" });
    }

    // 2) Construir DateTime do início (ex: 2026-01-14T15:30:00)
    const inicioStr = `${data}T${hora}:00`;
    const inicioNovo = new Date(inicioStr);

    if (isNaN(inicioNovo.getTime())) {
      return res.status(400).json({ erro: "Data/Hora inválidas" });
    }

    // 3) Ir buscar a duração do serviço (em minutos)
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

    // 4) Calcular o fim do novo agendamento
    const fimNovo = new Date(inicioNovo.getTime() + duracaoMin * 60000);

    // 5) Buscar TODOS os agendamentos existentes desse funcionário nesse dia (não cancelados)
    const existentes = await pool
      .request()
      .input("id_funcionario", sql.Int, id_funcionario)
      .input("data", sql.Date, new Date(`${data}T00:00:00`))
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

    // Função: verifica sobreposição de intervalos
    // há choque se: inicioNovo < fimExistente AND fimNovo > inicioExistente
    function sobrepoe(aIni, aFim, bIni, bFim) {
      return aIni < bFim && aFim > bIni;
    }

    // 6) Verificar se choca com algum agendamento existente
    for (const r of existentes.recordset) {
      const ini = new Date(r.inicio);
      const dur = parseInt(r.duracao, 10) || 30;
      const fim = new Date(ini.getTime() + dur * 60000);

      if (sobrepoe(inicioNovo, fimNovo, ini, fim)) {
        return res.status(409).json({
          erro: "Horário indisponível: existe um agendamento que se sobrepõe a este intervalo."
        });
      }
    }

    // 7) Se estiver livre, inserir o agendamento
    await pool
      .request()
      .input("id_cliente", sql.Int, id_cliente)
      .input("id_funcionario", sql.Int, id_funcionario)
      .input("id_servico", sql.Int, id_servico)
      .input("dataHora", sql.DateTime, inicioNovo)
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

// ✅ APAGAR AGENDAMENTO
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

// ✅ HORÁRIOS DISPONÍVEIS
// Exemplo: /horarios-disponiveis?id_funcionario=1&data=2026-01-14&id_servico=2
app.get("/horarios-disponiveis", async (req, res) => {
  try {
    const id_funcionario = parseInt(req.query.id_funcionario, 10);
    const data = req.query.data; // "YYYY-MM-DD"
    const id_servico = req.query.id_servico ? parseInt(req.query.id_servico, 10) : null;

    if (!id_funcionario || !data) {
      return res.status(400).json({ erro: "Faltam parâmetros: id_funcionario e data" });
    }

    // 1) Definir horário de funcionamento (podes ajustar)
    const HORA_ABERTURA = "09:00";
    const HORA_FECHO = "19:00";

    // 2) Duração do serviço (se não vier id_servico, usamos 30 minutos)
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

    // 3) Buscar agendamentos existentes nesse dia (com duração do serviço de cada um)
    const ags = await pool.request()
      .input("id_funcionario", sql.Int, id_funcionario)
      .input("data", sql.Date, new Date(`${data}T00:00:00`))
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

    // 4) Converter agendamentos em intervalos ocupados [inicio, fim]
    const ocupados = ags.recordset.map(r => {
      const ini = new Date(r.inicio);
      const fim = new Date(ini.getTime() + (parseInt(r.duracao, 10) || 30) * 60000);
      return { ini, fim };
    });

    // Função auxiliar: "HH:MM" -> Date no dia escolhido
    function dateAt(hhmm) {
      return new Date(`${data}T${hhmm}:00`);
    }

    // Função auxiliar: overlap de intervalos
    function sobrepoe(aIni, aFim, bIni, bFim) {
      return aIni < bFim && aFim > bIni;
    }

    // 5) Gerar slots (passos de 15 min para ser mais “pro”)
    const STEP_MIN = 15;
    const inicioDia = dateAt(HORA_ABERTURA);
    const fimDia = dateAt(HORA_FECHO);

    // (opcional) se a data for hoje, não sugerir horas no passado
    const agora = new Date();

    const disponiveis = [];
    for (
      let t = new Date(inicioDia);
      t.getTime() + duracaoMin * 60000 <= fimDia.getTime();
      t = new Date(t.getTime() + STEP_MIN * 60000)
    ) {
      const tFim = new Date(t.getTime() + duracaoMin * 60000);

      // não permitir no passado se for hoje
      if (tFim <= agora && data === agora.toISOString().slice(0, 10)) continue;

      // verificar se este slot choca com algum ocupado
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
    return res.status(500).json({ erro: err.message });
  }
});

/** Arranca o servidor */
app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr em http://localhost:${PORT}`);
});
