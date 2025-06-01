// codeService.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 1. Gerar e salvar código
async function saveCode(email, code) {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // expira em 15 minutos

  // Apaga códigos antigos para esse e-mail
  await supabase
    .from("password_reset_codes")
    .delete()
    .eq("email", email);

  const { error } = await supabase.from("password_reset_codes").insert([
    {
      email,
      code,
      expires_at: expiresAt.toISOString(),
      used: false
    }
  ]);

  if (error) {
    console.error("Erro ao salvar código:", error);
    throw error;
  }
}

// 2. Verificar código
async function verifyCode(email, code) {
  const { data, error } = await supabase
    .from("password_reset_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .eq("used", false)
    .single();

  if (error || !data) return false;

  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  return now < expiresAt;
}

// 3. Marcar como usado
async function markCodeAsUsed(email, code) {
  await supabase
    .from("password_reset_codes")
    .update({ used: true })
    .eq("email", email)
    .eq("code", code);
}

module.exports = { saveCode, verifyCode, markCodeAsUsed };
