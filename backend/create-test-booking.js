const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;',
    options: { trustServerCertificate: true }
};

async function createTestBooking() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Ligado ao SQL Server (Windows Auth)');

        // Verificar se há clientes, funcionários e serviços
        const [clientesResult, funcionariosResult, servicosResult] = await Promise.all([
            pool.request().query('SELECT * FROM Clientes'),
            pool.request().query('SELECT * FROM Funcionarios'),
            pool.request().query('SELECT * FROM Servicos')
        ]);

        console.log('✅ Clientes:', clientesResult.recordset.length);
        console.log('✅ Funcionários:', funcionariosResult.recordset.length);
        console.log('✅ Serviços:', servicosResult.recordset.length);

        if (clientesResult.recordset.length === 0) {
            // Criar cliente teste
            const clienteResult = await pool.request()
                .input('nome', sql.NVarChar(255), 'Cliente Teste')
                .input('email', sql.NVarChar(255), 'teste@example.com')
                .input('telefone', sql.NVarChar(20), '912345678')
                .input('senha', sql.NVarChar(255), 'teste123')
                .query('INSERT INTO Clientes (nome_cliente, email, telefone, senha) OUTPUT INSERTED.id_cliente VALUES (@nome, @email, @telefone, @senha)');

            clientesResult.recordset.push({ id_cliente: clienteResult.recordset[0].id_cliente });
        }

        if (funcionariosResult.recordset.length === 0) {
            // Criar funcionário teste
            const funcionarioResult = await pool.request()
                .input('nome', sql.NVarChar(255), 'Funcionário Teste')
                .query('INSERT INTO Funcionarios (nome_completo) OUTPUT INSERTED.id_funcionario VALUES (@nome)');

            funcionariosResult.recordset.push({ id_funcionario: funcionarioResult.recordset[0].id_funcionario });
        }

        if (servicosResult.recordset.length === 0) {
            // Criar serviço teste
            const servicoResult = await pool.request()
                .input('nome', sql.NVarChar(255), 'Serviço Teste')
                .input('preco', sql.Decimal(10, 2), 25.00)
                .input('duracao', sql.Int, 30)
                .query('INSERT INTO Servicos (nome_servico, preco, duracao_estimada) OUTPUT INSERTED.id_servico VALUES (@nome, @preco, @duracao)');

            servicosResult.recordset.push({ id_servico: servicoResult.recordset[0].id_servico });
        }

        // Criar agendamento teste
        const dataHora = new Date();
        dataHora.setDate(dataHora.getDate() + 1);
        dataHora.setHours(10, 0, 0, 0);

        const result = await pool.request()
            .input('id_cliente', sql.Int, clientesResult.recordset[0].id_cliente)
            .input('id_funcionario', sql.Int, funcionariosResult.recordset[0].id_funcionario)
            .input('id_servico', sql.Int, servicosResult.recordset[0].id_servico)
            .input('data_hora', sql.DateTime, dataHora)
            .input('observacoes', sql.NVarChar(500), 'Observação teste')
            .input('status', sql.NVarChar(50), 'Pendente')
            .query('INSERT INTO Agendamentos (id_cliente, id_funcionario, id_servico, data_hora_agendamento, observacoes, status) OUTPUT INSERTED.id_agendamentos VALUES (@id_cliente, @id_funcionario, @id_servico, @data_hora, @observacoes, @status)');

        console.log('✅ Agendamento teste criado com sucesso');
        console.log('ID do agendamento:', result.recordset[0].id_agendamentos);

        // Verificar o agendamento criado
        const bookingResult = await pool.request()
            .input('id', sql.Int, result.recordset[0].id_agendamentos)
            .query('SELECT * FROM Agendamentos WHERE id_agendamentos = @id');

        console.log('✅ Detalhes do agendamento:');
        console.log(bookingResult.recordset[0]);
    } catch (err) {
        console.error('❌ Erro ao criar agendamento teste:', err.message);
    }
}

createTestBooking();
