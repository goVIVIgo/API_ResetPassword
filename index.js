const express = require('express');
const supabase = require('./supabaseClient'); 
const { sendCodeEmail, sendConfirmationEmail } = require('./mailer'); 

const app = express();
app.use(express.json());

const verificationCodes = new Map(); 


app.post('/validate-email', async (req, res) => {
  const { email } = req.body;
  console.log('Validando email:', email);

  if (!email) {
    return res.status(400).json({ message: 'Email é obrigatório' });
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Erro ao acessar Supabase Auth:', error);
      return res.status(500).json({ message: 'Erro ao acessar Supabase' });
    }

    const user = data.users.find((u) => u.email === email);

    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário encontrado' });
  } catch (err) {
    console.error('Erro interno ao validar e-mail:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Envia um código por e-mail e salva temporariamente em memória
app.post('/send-code', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email é obrigatório' });

  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Erro ao acessar Supabase Auth:', error);
      return res.status(500).json({ message: 'Erro ao acessar Supabase' });
    }

    const user = data.users.find((u) => u.email === email);

    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; 

    verificationCodes.set(email, { code, expiresAt });

    await sendCodeEmail(email, code); 

    console.log(`Código ${code} enviado para ${email}`);
    res.json({ message: 'Código enviado para o e-mail' });
  } catch (err) {
    console.error('Erro ao enviar código:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Verifica se o código está correto e ainda válido
app.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Código obrigatório' });
  }

  const record = verificationCodes.get(email);

  if (!record) {
    return res.status(404).json({ message: 'Código não encontrado para este e-mail' });
  }

  if (record.code !== code) {
    return res.status(401).json({ message: 'Código inválido' });
  }

  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(email);
    return res.status(410).json({ message: 'Código expirado' });
  }

  res.json({ message: 'Código verificado com sucesso' });
});

// Atualiza a senha após o código ter sido verificado
app.post('/update-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email e nova senha são obrigatórios' });
  }

  const record = verificationCodes.get(email);

  if (!record) {
    return res.status(403).json({ message: 'Código não verificado para este e-mail' });
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    const user = data.users.find((u) => u.email === email);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      return res.status(500).json({ message: 'Erro ao atualizar senha' });
    }

    verificationCodes.delete(email); 

    await sendConfirmationEmail(email); 

    console.log(`Senha atualizada para ${email}`);

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar senha:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

// Inicializa o servidor
app.listen(3000, () => {
  console.log('Servidor rodando em http://192.168.0.115:3000');
});
