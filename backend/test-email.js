/**
 * Testa o envio de emails
 * Executar: node backend/test-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const emailService = require('./emailService');

// Configurações do email de teste
const TEST_EMAIL = 'seu-email@teste.com'; // Altere para o seu email real
const TEST_NOME = 'Teste Cliente';

// Testa a conexão SMTP
async function testConnection() {
    console.log('🔍 Testando conexão SMTP...');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Porta:', process.env.EMAIL_PORT);
    console.log('User:', process.env.EMAIL_USER);
    
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.verify();
        console.log('✅ Conexão SMTP OK');
        return transporter;
    } catch (error) {
        console.error('❌ Erro na conexão SMTP:', error.message);
        return null;
    }
}

// Testa o envio de email pendente
async function testPendingEmail() {
    console.log('\n📧 Testando email de pendente...');
    try {
        const resultado = await emailService.sendPendingConfirmationEmail(
            TEST_EMAIL,
            TEST_NOME,
            {
                data: '12/12/2024',
                hora: '14:30',
                servico: 'Corte de Cabelo',
                funcionario: 'João Barbear'
            }
        );
        console.log('✅ Email pendente enviado:', resultado.messageId);
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

// Testa o envio de email confirmado
async function testConfirmedEmail() {
    console.log('\n✅ Testando email de confirmação...');
    try {
        const resultado = await emailService.sendConfirmedEmail(
            TEST_EMAIL,
            TEST_NOME,
            {
                data: '12/12/2024',
                hora: '14:30',
                servico: 'Corte de Cabelo',
                funcionario: 'João Barbear'
            }
        );
        console.log('✅ Email de confirmação enviado:', resultado.messageId);
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

// Testa o envio de email lembrete
async function testReminderEmail() {
    console.log('\n⏰ Testando email de lembrete...');
    try {
        const resultado = await emailService.sendReminderEmail(
            TEST_EMAIL,
            TEST_NOME,
            {
                data: '12/12/2024',
                hora: '14:30',
                servico: 'Corte de Cabelo',
                funcionario: 'João Barbear'
            },
            24
        );
        console.log('✅ Email de lembrete enviado:', resultado.messageId);
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

// Testa o envio de email ao barbeiro
async function testBarberEmail() {
    console.log('\n💈 Testando email ao barbeiro...');
    try {
        const resultado = await emailService.sendBarberNotificationEmail(
            TEST_EMAIL,
            'João Barbear',
            {
                cliente: 'Maria Silva',
                data: '12/12/2024',
                hora: '14:30',
                servico: 'Corte de Cabelo',
                observacoes: 'Quero um corte moderno'
            }
        );
        console.log('✅ Email ao barbeiro enviado:', resultado.messageId);
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

// Executa todos os testes
async function runAllTests() {
    console.log('🧪 Iniciando testes de email...\n');
    
    // Testa conectividade primeiro
    const transporter = await testConnection();
    if (!transporter) {
        console.log('\n❌ Testes abortados: Erro de conexão');
        return;
    }

    // Testa todos os tipos de emails
    await testPendingEmail();
    await testConfirmedEmail();
    await testReminderEmail();
    await testBarberEmail();
    
    console.log('\n🎉 Testes concluídos! Verifica a tua caixa de entrada e spam.');
}

// Inicia os testes
runAllTests().catch(error => {
    console.error('❌ Erro global:', error.message);
    console.error(error.stack);
});