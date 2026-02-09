/**
 * emailService.js — Módulo de envio de emails
 * Usa Nodemailer para enviar emails via SMTP
 */

require("dotenv").config();
const nodemailer = require("nodemailer");

// Configuração do transporter SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Enviar email de confirmação de agendamento pendente
 */
async function sendPendingConfirmationEmail(clienteEmail, clienteNome, agendamento) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: clienteEmail,
    subject: "📅 Agendamento Pendente - Barbearia PAP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Olá, ${clienteNome}!</h2>
        <p>O teu agendamento está <strong>pendente de confirmação</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #555;">Detalhes do Agendamento</h3>
          <p><strong>Data:</strong> ${agendamento.data}</p>
          <p><strong>Hora:</strong> ${agendamento.hora}</p>
          <p><strong>Serviço:</strong> ${agendamento.servico}</p>
          <p><strong>Profissional:</strong> ${agendamento.funcionario}</p>
        </div>
        
        <p>Receberás outro email quando o teu agendamento for <strong>confirmado</strong> pelo administrador.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Barbearia PAP - Obrigado pela preferência!</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Enviar email de agendamento confirmado
 */
async function sendConfirmedEmail(clienteEmail, clienteNome, agendamento) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: clienteEmail,
    subject: "✅ Agendamento Confirmado - Barbearia PAP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Parabéns, ${clienteNome}!</h2>
        <p>O teu agendamento foi <strong>confirmado com sucesso</strong>!</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #155724;">Detalhes do Agendamento</h3>
          <p><strong>Data:</strong> ${agendamento.data}</p>
          <p><strong>Hora:</strong> ${agendamento.hora}</p>
          <p><strong>Serviço:</strong> ${agendamento.servico}</p>
          <p><strong>Profissional:</strong> ${agendamento.funcionario}</p>
        </div>
        
        <p>Por favor, chega <strong>5 minutos antes</strong> do horário marcado.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Barbearia PAP - Obrigado pela preferência!</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Enviar email de lembrete de agendamento
 */
async function sendReminderEmail(clienteEmail, clienteNome, agendamento, horasRestantes) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: clienteEmail,
    subject: "⏰ Lembrete: Tens um agendamento amanhã!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">Olá, ${clienteNome}!</h2>
        <p>Queremos-te lembrar que tens um agendamento <strong>em ${horasRestantes} horas</strong>.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #856404;">Detalhes do Agendamento</h3>
          <p><strong>Data:</strong> ${agendamento.data}</p>
          <p><strong>Hora:</strong> ${agendamento.hora}</p>
          <p><strong>Serviço:</strong> ${agendamento.servico}</p>
          <p><strong>Profissional:</strong> ${agendamento.funcionario}</p>
        </div>
        
        <p>Não te esqueças de trazer o comprovante de marcação (se aplicável).</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Barbearia PAP - Obrigado pela preferência!</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Enviar email de notificação ao barbeiro
 */
async function sendBarberNotificationEmail(barbeiroEmail, barbeiroNome, agendamento) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: barbeiroEmail,
    subject: "📅 Novo Agendamento - Barbearia PAP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Olá, ${barbeiroNome}!</h2>
        <p>Tens um <strong>novo agendamento</strong> pendente.</p>
        
        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="margin-top: 0; color: #0056b3;">Detalhes do Agendamento</h3>
          <p><strong>Cliente:</strong> ${agendamento.cliente}</p>
          <p><strong>Data:</strong> ${agendamento.data}</p>
          <p><strong>Hora:</strong> ${agendamento.hora}</p>
          <p><strong>Serviço:</strong> ${agendamento.servico}</p>
          ${agendamento.observacoes ? `<p><strong>Observações:</strong> ${agendamento.observacoes}</p>` : ""}
        </div>
        
        <p>Accede ao painel de administração para confirmar ou ajustar o horário.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Barbearia PAP - Sistema Automático</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Enviar email de cancelamento
 */
async function sendCancellationEmail(clienteEmail, clienteNome, agendamento) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: clienteEmail,
    subject: "❌ Agendamento Cancelado - Barbearia PAP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Olá, ${clienteNome}!</h2>
        <p>O teu agendamento foi <strong>cancelado</strong>.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24;">Detalhes do Agendamento Cancelado</h3>
          <p><strong>Data:</strong> ${agendamento.data}</p>
          <p><strong>Hora:</strong> ${agendamento.hora}</p>
          <p><strong>Serviço:</strong> ${agendamento.servico}</p>
          <p><strong>Profissional:</strong> ${agendamento.funcionario}</p>
        </div>
        
        <p>Se quiseres remarcar, visita o nosso site.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Barbearia PAP - Obrigado pela preferência!</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendPendingConfirmationEmail,
  sendConfirmedEmail,
  sendReminderEmail,
  sendBarberNotificationEmail,
  sendCancellationEmail,
};
