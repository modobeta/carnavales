import nodemailer from "nodemailer";

class ConsoleEmailAdapter {
  constructor({ env, logger }) {
    this.env = env;
    this.logger = logger;
  }

  async send({ subject, otp, resetUrl }) {
    const timestamp = new Date().toLocaleTimeString();
    this.logger.log("\n========================================");
    this.logger.log("EMAIL [Console Adapter]");
    this.logger.log(`Hora: ${timestamp}`);
    this.logger.log(`Asunto: ${subject}`);

    if (otp && this.env.NODE_ENV !== "production") {
      this.logger.log(`Código OTP (solo desarrollo): ${otp}`);
    } else if (resetUrl && this.env.NODE_ENV !== "production") {
      this.logger.log(`Enlace de recuperación (solo desarrollo): ${resetUrl}`);
    } else {
      this.logger.log("Contenido sensible omitido de los logs");
    }

    this.logger.log("========================================\n");
  }
}

class SmtpEmailAdapter {
  constructor({ env, transportFactory }) {
    this.env = env;
    this.transporter = transportFactory({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT) || 587,
      secure: Number(env.SMTP_PORT) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  async send({ to, subject, html }) {
    await this.transporter.sendMail({
      from: this.env.EMAIL_FROM || this.env.MAIL_FROM || "noreply@example.com",
      to,
      subject,
      html,
    });
  }
}

export function createEmailService({
  env = process.env,
  logger = console,
  transportFactory = nodemailer.createTransport,
} = {}) {
  return {
    async send(message) {
      const provider = env.EMAIL_PROVIDER || "console";

      if (env.NODE_ENV === "production" && provider !== "smtp") {
        throw new Error("SMTP debe estar configurado en producción");
      }

      const adapter = provider === "smtp"
        ? new SmtpEmailAdapter({ env, transportFactory })
        : new ConsoleEmailAdapter({ env, logger });

      return adapter.send(message);
    },
  };
}

export const emailService = createEmailService();

export async function sendPasswordResetEmail(
  { user, token },
  {
    env = process.env,
    service = emailService,
    logger = console,
  } = {},
) {
  const frontendBase = env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendBase}/reset-password?token=${token}`;

  try {
    await service.send({
      to: user.email,
      subject: "Recupera tu contraseña - Carnavales",
      resetUrl,
      html: `
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este enlace expirará en 30 minutos.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      `,
    });
    return true;
  } catch {
    logger.error("Password reset email delivery failed");
    return false;
  }
}
