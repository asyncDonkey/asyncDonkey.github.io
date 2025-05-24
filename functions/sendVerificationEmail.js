// functions/sendVerificationEmail.js

const { onUserCreate } = require("firebase-functions/v2/auth");
const { logger } = require("firebase-functions");
const { getAuth } = require("firebase-admin/auth");
const { defineSecret } = require("firebase-functions/params");
const { Resend } = require("resend");

// Definisci il secret per la chiave API di Resend
const resendApiKey = defineSecret("RESEND_API_KEY");

/**
 * Funzione che si attiva alla creazione di un nuovo utente Firebase Authentication.
 * Invia un'email di verifica personalizzata tramite Resend.
 */
exports.sendVerificationEmail = onUserCreate({ secrets: [resendApiKey] }, async (event) => {
    const user = event.data; // L'oggetto utente appena creato
    const userEmail = user.email;
    const displayName = user.displayName || userEmail.split('@')[0];

    if (!userEmail) {
        logger.warn(`L'utente ${user.uid} si è registrato senza un indirizzo email.`);
        return;
    }

    // Inizializza Resend con la chiave API dal secret manager
    const resend = new Resend(resendApiKey.value());

    try {
        // Genera il link di verifica dell'email
        const link = await getAuth().generateEmailVerificationLink(userEmail);

        // Il nostro template HTML personalizzato
        const emailHtml = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
              <meta charset="UTF-8"><title>Verifica Email</title>
              <style>body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; } img { -ms-interpolation-mode: bicubic; border: 0; } body { margin: 0 !important; padding: 0 !important; background-color: #f4f4f4; }</style>
            </head>
            <body style="margin: 0 !important; padding: 0 !important; background-color: #f4f4f4;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td bgcolor="#f4f4f4" align="center" style="padding: 20px 0 30px 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                        <td align="center" style="padding: 30px; background-color: #ffffff; border-radius: 8px 8px 0 0; font-family: 'Arial', sans-serif;">
                          <h1 style="font-size: 28px; font-weight: bold; margin: 0;">asyncDonkey.io</h1>
                        </td>
                      </tr>
                      <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Arial', sans-serif; font-size: 16px; line-height: 25px;">
                          <p style="margin: 0;">Ciao ${displayName},</p>
                          <p style="margin: 15px 0 0 0;">Grazie per la tua registrazione! Manca solo un piccolo passo per attivare il tuo account. Clicca sul pulsante qui sotto per verificare il tuo indirizzo email.</p>
                        </td>
                      </tr>
                      <tr>
                        <td bgcolor="#ffffff" align="center" style="padding: 0 30px 20px 30px;">
                            <a href="${link}" target="_blank" style="font-size: 18px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 5px; background-color: #007bff; display: inline-block;">Verifica il tuo Account</a>
                        </td>
                      </tr>
                       <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Arial', sans-serif; font-size: 14px; line-height: 25px;">
                          <p style="margin: 0;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
                          <p style="margin: 10px 0 0 0; word-break: break-all;"><a href="${link}" target="_blank" style="color: #007bff;">${link}</a></p>
                        </td>
                      </tr>
                      <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 8px 8px; color: #666666; font-family: 'Arial', sans-serif; font-size: 14px; line-height: 25px;">
                          <p style="margin: 0;">Se non hai creato un account su asyncDonkey.io, puoi tranquillamente ignorare questa email.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                 <tr>
                  <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 20px 10px;">
                    <p style="margin: 0; color: #666666; font-family: 'Arial', sans-serif; font-size: 12px;">© 2025 asyncDonkey.io. Tutti i diritti riservati.</p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
        `;

        // Invia l'email
        await resend.emails.send({
            from: 'onboarding@resend.dev', // <-- IMPORTANTE: Vedi nota sotto
            to: userEmail,
            subject: 'Conferma il tuo indirizzo email per asyncDonkey.io',
            html: emailHtml,
        });

        logger.info(`Email di verifica inviata a ${userEmail} tramite Resend.`);

    } catch (error) {
        logger.error(`Errore durante l'invio dell'email di verifica a ${userEmail}:`, error);
    }
});