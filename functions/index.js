const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Recupera a chave API do SendGrid das configurações de ambiente
const sendgridApiKey = functions.config().sendgrid?.key;

/**
 * Função Cloud que envia e-mails a novos usuários
 * Ativada quando um novo documento é adicionado à coleção 'users'
 */
exports.enviarEmailNovoUsuario = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    try {
      // Verifica se a chave API do SendGrid está configurada
      if (!sendgridApiKey) {
        console.error('Chave da API SendGrid não configurada. Configure com: firebase functions:config:set sendgrid.key="SUA_CHAVE_API"');
        return null;
      }

      // Configura a chave API do SendGrid
      sgMail.setApiKey(sendgridApiKey);

      // Obtém os dados do usuário do documento Firestore
      const userData = snap.data();
      const { email, nome } = userData;

      if (!email) {
        console.error('Email do usuário não encontrado no documento');
        return null;
      }

      // Configura a mensagem de e-mail
      const msg = {
        to: email,
        from: 'noreply@agentesintegrados.databutton.app', // Email verificado no SendGrid
        subject: 'Bem-vindo aos Agentes Integrados!',
        text: `Olá ${nome || 'usuário'},\n\nObrigado por se cadastrar em nossa plataforma. Estamos felizes em tê-lo conosco!\n\nAtenciosamente,\nEquipe Agentes Integrados`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4285f4;">Bem-vindo aos Agentes Integrados!</h2>
          <p>Olá <strong>${nome || 'usuário'}</strong>,</p>
          <p>Obrigado por se cadastrar em nossa plataforma. Estamos felizes em tê-lo conosco!</p>
          <p>Você agora pode acessar todos os recursos disponíveis em nossa plataforma.</p>
          <div style="margin: 25px 0;">
            <a href="https://agentesintegrados.databutton.app" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Acessar a plataforma</a>
          </div>
          <p>Atenciosamente,<br>Equipe Agentes Integrados</p>
        </div>`
      };

      // Envia o e-mail
      await sgMail.send(msg);
      
      console.log(`E-mail de boas-vindas enviado para: ${email}`);
      return null;
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      return null;
    }
  });

/**
 * Função de exemplo HTTP para testar o envio de e-mail
 * Use apenas para teste durante o desenvolvimento
 */
exports.testarEnvioEmail = functions.https.onRequest(async (req, res) => {
  try {
    // Apenas aceita método POST
    if (req.method !== 'POST') {
      return res.status(405).send('Método não permitido. Use POST.');
    }

    // Verifica se a chave API do SendGrid está configurada
    if (!sendgridApiKey) {
      return res.status(500).send('Chave da API SendGrid não configurada. Configure com: firebase functions:config:set sendgrid.key="SUA_CHAVE_API"');
    }

    // Configura a chave API do SendGrid
    sgMail.setApiKey(sendgridApiKey);

    // Obtém os dados do corpo da requisição
    const { email, nome } = req.body;

    if (!email) {
      return res.status(400).send('Email é obrigatório');
    }

    // Configura a mensagem de e-mail
    const msg = {
      to: email,
      from: 'noreply@agentesintegrados.databutton.app', // Email verificado no SendGrid
      subject: 'Teste - Bem-vindo aos Agentes Integrados!',
      text: `Olá ${nome || 'usuário'},\n\nEste é um e-mail de teste da plataforma Agentes Integrados.\n\nAtenciosamente,\nEquipe Agentes Integrados`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4285f4;">Teste - Bem-vindo aos Agentes Integrados!</h2>
        <p>Olá <strong>${nome || 'usuário'}</strong>,</p>
        <p>Este é um e-mail de teste da plataforma Agentes Integrados.</p>
        <p>Se você está recebendo este e-mail, a configuração do SendGrid está funcionando corretamente!</p>
        <p>Atenciosamente,<br>Equipe Agentes Integrados</p>
      </div>`
    };

    // Envia o e-mail
    await sgMail.send(msg);
    
    return res.status(200).send('E-mail de teste enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar e-mail de teste:', error);
    return res.status(500).send(`Erro ao enviar e-mail: ${error.message}`);
  }
}); 