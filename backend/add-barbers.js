const sql = require('mssql/msnodesqlv8');
const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;',
  options: { trustServerCertificate: true }
};

async function addBarbers() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ Ligado ao SQL Server');
    
    // 1. Adicionar Dydas
    console.log('📝 Adicionando Dydas...');
    const resultDydas = await pool.request()
      .input('nome', sql.NVarChar(100), 'Dydas')
      .input('especialidade', sql.NVarChar(100), 'Specialist Barber')
      .input('email', sql.NVarChar(100), 'dydas@barbeariaflokiko.pt')
      .input('telefone', sql.NVarChar(20), '911234567')
      .query(`
        INSERT INTO Funcionarios (nome_completo, especialidade, email, telefone, data_contratacao)
        OUTPUT INSERTED.id_funcionario
        VALUES (@nome, @especialidade, @email, @telefone, GETDATE())
      `);
    
    const idDydas = resultDydas.recordset[0].id_funcionario;
    console.log(`✅ Dydas adicionado com id_funcionario = ${idDydas}`);
    
    // 2. Adicionar horário de Dydas
    console.log('📅 Adicionando horário de Dydas...');
    const horarioDydas = [
      { dia_semana: 1, hora_inicio: '09:00', hora_fim: '18:00' }, // Segunda
      { dia_semana: 2, hora_inicio: '09:00', hora_fim: '18:00' }, // Terça
      { dia_semana: 3, hora_inicio: '10:00', hora_fim: '19:00' }, // Quarta
      { dia_semana: 4, hora_inicio: '09:00', hora_fim: '18:00' }, // Quinta
      { dia_semana: 5, hora_inicio: '09:00', hora_fim: '20:00' }, // Sexta
      { dia_semana: 6, hora_inicio: '09:00', hora_fim: '17:00' }  // Sábado
    ];
    
    for (const h of horarioDydas) {
      await pool.request()
        .input('id_funcionario', sql.Int, idDydas)
        .input('dia_semana', sql.TinyInt, h.dia_semana)
        .input('hora_inicio', sql.Time, h.hora_inicio)
        .input('hora_fim', sql.Time, h.hora_fim)
        .query(`
          INSERT INTO Horario (id_funcionario, dia_semana, hora_inicio, hora_fim)
          VALUES (@id_funcionario, @dia_semana, @hora_inicio, @hora_fim)
        `);
    }
    
    // 3. Adicionar Renato Almeida
    console.log('📝 Adicionando Renato Almeida...');
    const resultRenato = await pool.request()
      .input('nome', sql.NVarChar(100), 'Renato Almeida')
      .input('especialidade', sql.NVarChar(100), 'Rookie Barber')
      .input('email', sql.NVarChar(100), 'renato@barbeariaflokiko.pt')
      .input('telefone', sql.NVarChar(20), '919876543')
      .query(`
        INSERT INTO Funcionarios (nome_completo, especialidade, email, telefone, data_contratacao)
        OUTPUT INSERTED.id_funcionario
        VALUES (@nome, @especialidade, @email, @telefone, GETDATE())
      `);
    
    const idRenato = resultRenato.recordset[0].id_funcionario;
    console.log(`✅ Renato Almeida adicionado com id_funcionario = ${idRenato}`);
    
    // 4. Adicionar horário de Renato
    console.log('📅 Adicionando horário de Renato...');
    const horarioRenato = [
      { dia_semana: 1, hora_inicio: '10:00', hora_fim: '19:00' }, // Segunda
      { dia_semana: 2, hora_inicio: '10:00', hora_fim: '19:00' }, // Terça
      { dia_semana: 4, hora_inicio: '10:00', hora_fim: '19:00' }, // Quinta
      { dia_semana: 5, hora_inicio: '10:00', hora_fim: '20:00' }, // Sexta
      { dia_semana: 6, hora_inicio: '09:00', hora_fim: '18:00' }  // Sábado
    ];
    
    for (const h of horarioRenato) {
      await pool.request()
        .input('id_funcionario', sql.Int, idRenato)
        .input('dia_semana', sql.TinyInt, h.dia_semana)
        .input('hora_inicio', sql.Time, h.hora_inicio)
        .input('hora_fim', sql.Time, h.hora_fim)
        .query(`
          INSERT INTO Horario (id_funcionario, dia_semana, hora_inicio, hora_fim)
          VALUES (@id_funcionario, @dia_semana, @hora_inicio, @hora_fim)
        `);
    }
    
    // Verificar se os barbeiros foram adicionados
    const allFuncionarios = await pool.request().query('SELECT * FROM Funcionarios');
    console.log('📋 Todos os funcionários:');
    console.log(allFuncionarios.recordset);
    
    console.log('✅ Processo concluído com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

addBarbers();
