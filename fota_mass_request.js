#!/usr/bin/env node

/**
 * SISTEMA AUTOMATIZZATO PER RICHIESTE FOTA DI MASSA
 *
 * Questo script automatizza l'invio di richieste FOTA (Firmware Over The Air)
 * di massa al produttore per sbloccare centinaia di orologi GPS contemporaneamente.
 *
 * Autore: Fabio Marchetti
 * Data: 1 Gennaio 2026
 * Progetto: GPS Tracker - FOTA Mass Request
 */

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

class FOTAMassRequest {
  constructor(config = {}) {
    this.config = {
      // Configurazione email
      email: {
        service: config.emailService || "gmail",
        user: config.emailUser || process.env.EMAIL_USER,
        password: config.emailPassword || process.env.EMAIL_PASSWORD,
        from: config.emailFrom || process.env.EMAIL_FROM,
      },

      // Configurazione server di destinazione
      targetServer: {
        ip: config.serverIP || "91.99.141.225",
        port: config.serverPort || 8001,
        protocol: config.protocol || "standard",
      },

      // Informazioni business
      business: {
        name: config.businessName || "GPS Tracker Healthcare System",
        contact: config.businessContact || "Fabio Marchetti",
        email: config.businessEmail || process.env.BUSINESS_EMAIL,
        phone: config.businessPhone || process.env.BUSINESS_PHONE,
        contractValue: config.contractValue || "€50,000+",
      },
    };

    // Destinatari email produttore
    this.manufacturerContacts = [
      "sales@4p-touch.com",
      "info@setracker.com",
      "info@iwonlex.net",
      "support@wonlex.com",
      "tech@4p-touch.com",
    ];

    this.transporter = null;
  }

  /**
   * Inizializza il trasportatore email
   */
  async initializeEmailTransporter() {
    console.log("📧 Inizializzazione trasportatore email...");

    try {
      this.transporter = nodemailer.createTransporter({
        service: this.config.email.service,
        auth: {
          user: this.config.email.user,
          pass: this.config.email.password,
        },
      });

      // Verifica configurazione
      await this.transporter.verify();
      console.log("✅ Trasportatore email configurato correttamente");
      return true;
    } catch (error) {
      console.error("❌ Errore configurazione email:", error.message);
      return false;
    }
  }

  /**
   * Carica lista dispositivi da file CSV
   */
  async loadDeviceList(csvFile) {
    console.log(`📄 Caricamento dispositivi da: ${csvFile}`);

    return new Promise((resolve, reject) => {
      const devices = [];

      fs.createReadStream(csvFile)
        .pipe(csv())
        .on("data", (row) => {
          const device = {
            imei: row.IMEI || row.imei || row.Imei,
            registrationCode:
              row.RegistrationCode || row.registration_code || row.RegCode,
            model: row.Model || row.model || "C405_KYS_S5",
            notes: row.Notes || row.notes || "",
          };

          if (device.imei && device.registrationCode) {
            devices.push(device);
          }
        })
        .on("end", () => {
          console.log(`✅ Caricati ${devices.length} dispositivi`);
          resolve(devices);
        })
        .on("error", reject);
    });
  }

  /**
   * Genera email template per richiesta FOTA di massa
   */
  generateFOTARequestEmail(devices) {
    const deviceCount = devices.length;
    const sampleDevices = devices.slice(0, 5);
    const remainingCount = Math.max(0, deviceCount - 5);

    const subject = `URGENT - Mass FOTA Request for ${deviceCount}+ GPS Watches Healthcare Contract`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .urgent { background: #e74c3c; color: white; padding: 10px; text-align: center; font-weight: bold; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #3498db; background: #f8f9fa; }
        .device-list { background: #ecf0f1; padding: 15px; border-radius: 5px; }
        .highlight { background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px; }
        .footer { background: #34495e; color: white; padding: 15px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #3498db; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 URGENT MASS FOTA REQUEST</h1>
        <p>Healthcare GPS Tracking System - Italy</p>
    </div>
    
    <div class="urgent">
        CRITICAL: ${deviceCount} GPS watches need immediate FOTA for patient safety monitoring
    </div>
    
    <div class="content">
        <h2>Dear Technical Team,</h2>
        
        <p>I am <strong>${
          this.config.business.contact
        }</strong>, managing a critical GPS tracking system for elderly healthcare in Italy.</p>
        
        <div class="section">
            <h3>📋 CONTRACT DETAILS</h3>
            <table>
                <tr><th>Current Devices</th><td><span class="highlight">${deviceCount}+ C405_KYS_S5_V1.3_2025 GPS watches</span></td></tr>
                <tr><th>Target Deployment</th><td>1000+ devices in 2025</td></tr>
                <tr><th>Business Type</th><td>Healthcare monitoring for elderly patients</td></tr>
                <tr><th>Contract Value</th><td><span class="highlight">${
                  this.config.business.contractValue
                }</span></td></tr>
                <tr><th>Compliance</th><td>GDPR required (EU healthcare data)</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h3>🖥️ TECHNICAL REQUIREMENTS</h3>
            <table>
                <tr><th>Server IP</th><td><code>${
                  this.config.targetServer.ip
                }</code></td></tr>
                <tr><th>Server Port</th><td><code>${
                  this.config.targetServer.port
                }</code></td></tr>
                <tr><th>Protocol</th><td><span class="highlight">Standard TCP (non-encrypted)</span></td></tr>
                <tr><th>Database</th><td>PostgreSQL with health monitoring</td></tr>
                <tr><th>Upload Interval</th><td>30 seconds for real-time monitoring</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h3>🎯 MASS FOTA REQUEST</h3>
            <p><strong>I need IMMEDIATE MASS FOTA to configure ALL ${deviceCount} devices to:</strong></p>
            <ol>
                <li>✅ Connect to my server (${this.config.targetServer.ip}:${
      this.config.targetServer.port
    })</li>
                <li>✅ Use standard protocol (NOT AQSH+ encrypted)</li>
                <li>✅ Enable health monitoring functions</li>
                <li>✅ Set upload interval to 30 seconds</li>
                <li>✅ Configure timezone: Europe/Rome</li>
            </ol>
        </div>
        
        <div class="section">
            <h3>📱 DEVICE LIST SAMPLE</h3>
            <div class="device-list">
                <p><strong>Sample devices (showing ${
                  sampleDevices.length
                } of ${deviceCount}):</strong></p>
                <table>
                    <tr><th>IMEI</th><th>Registration Code</th><th>Model</th><th>Notes</th></tr>
                    ${sampleDevices
                      .map(
                        (device) => `
                        <tr>
                            <td><code>${device.imei}</code></td>
                            <td><code>${device.registrationCode}</code></td>
                            <td>${device.model}</td>
                            <td>${device.notes}</td>
                        </tr>
                    `
                      )
                      .join("")}
                    ${
                      remainingCount > 0
                        ? `<tr><td colspan="4"><em>... and ${remainingCount} more devices (full list attached)</em></td></tr>`
                        : ""
                    }
                </table>
            </div>
        </div>
        
        <div class="section">
            <h3>🏥 BUSINESS JUSTIFICATION</h3>
            <ul>
                <li><strong>Healthcare application</strong> for elderly safety monitoring</li>
                <li><strong>GDPR compliance required</strong> (EU servers mandatory)</li>
                <li><strong>Real-time monitoring critical</strong> for patient safety</li>
                <li><strong>Bulk purchase contract</strong> worth ${
                  this.config.business.contractValue
                }</li>
                <li><strong>Immediate deployment needed</strong> for patient care</li>
            </ul>
        </div>
        
        <div class="section">
            <h3>📋 WHAT I NEED FROM YOU</h3>
            <ol>
                <li><span class="highlight">Mass FOTA capability</span> for all ${deviceCount} devices</li>
                <li><span class="highlight">Standard protocol firmware</span> (no AQSH+ encryption)</li>
                <li><span class="highlight">Bulk configuration tool</span> or API access</li>
                <li><span class="highlight">Technical documentation</span> for integration</li>
                <li><span class="highlight">Priority support</span> for healthcare application</li>
            </ol>
        </div>
        
        <div class="urgent">
            ⚠️ This is URGENT for patient safety. Please respond within 24 hours. ⚠️
        </div>
        
        <div class="section">
            <h3>📞 CONTACT INFORMATION</h3>
            <table>
                <tr><th>Name</th><td>${this.config.business.contact}</td></tr>
                <tr><th>Company</th><td>${this.config.business.name}</td></tr>
                <tr><th>Email</th><td><a href="mailto:${
                  this.config.business.email
                }">${this.config.business.email}</a></td></tr>
                <tr><th>Phone</th><td>${this.config.business.phone}</td></tr>
                <tr><th>Project</th><td>GPS Tracker Healthcare System - Italy</td></tr>
            </table>
        </div>
        
        <p><strong>Thank you for your urgent assistance with this critical healthcare project.</strong></p>
        
        <p>Best regards,<br>
        <strong>${this.config.business.contact}</strong><br>
        GPS Tracker Project Manager<br>
        Healthcare Technology Division</p>
    </div>
    
    <div class="footer">
        <p>🏥 Healthcare GPS Tracking System | 🇮🇹 Made in Italy | 📧 ${
          this.config.business.email
        }</p>
    </div>
</body>
</html>`;

    const textContent = `
URGENT - Mass FOTA Request for ${deviceCount}+ GPS Watches Healthcare Contract

Dear Technical Team,

I am ${
      this.config.business.contact
    }, managing a critical GPS tracking system for elderly healthcare in Italy.

CONTRACT DETAILS:
- Current devices: ${deviceCount}+ C405_KYS_S5_V1.3_2025 GPS watches
- Target deployment: 1000+ devices in 2025
- Business: Healthcare monitoring for elderly patients
- Contract value: ${this.config.business.contractValue}

TECHNICAL REQUIREMENTS:
- Server IP: ${this.config.targetServer.ip}
- Server Port: ${this.config.targetServer.port}
- Protocol: Standard TCP (non-encrypted)
- Database: PostgreSQL with health monitoring

MASS FOTA REQUEST:
I need IMMEDIATE MASS FOTA to configure ALL ${deviceCount} devices to:
1. Connect to my server (${this.config.targetServer.ip}:${
      this.config.targetServer.port
    })
2. Use standard protocol (NOT AQSH+ encrypted)
3. Enable health monitoring functions
4. Set upload interval to 30 seconds

DEVICE LIST SAMPLE:
${sampleDevices
  .map(
    (device) => `- IMEI: ${device.imei}, RegCode: ${device.registrationCode}`
  )
  .join("\n")}
${
  remainingCount > 0
    ? `... and ${remainingCount} more devices (full list attached)`
    : ""
}

BUSINESS JUSTIFICATION:
- Healthcare application for elderly safety
- GDPR compliance required (EU servers)
- Real-time monitoring critical for patient safety
- Bulk purchase contract worth ${this.config.business.contractValue}

WHAT I NEED:
1. Mass FOTA capability for all devices
2. Standard protocol firmware (no encryption)
3. Bulk configuration tool
4. Technical documentation

This is URGENT for patient safety. Please respond within 24 hours.

Best regards,
${this.config.business.contact}
GPS Tracker Project Manager
Email: ${this.config.business.email}
Phone: ${this.config.business.phone}
`;

    return { subject, htmlContent, textContent };
  }

  /**
   * Genera file CSV allegato con tutti i dispositivi
   */
  generateDeviceCSV(devices, filename) {
    const csvHeader = "IMEI,RegistrationCode,Model,Notes\n";
    const csvData = devices
      .map(
        (device) =>
          `${device.imei},${device.registrationCode},${device.model},"${device.notes}"`
      )
      .join("\n");

    const fullCSV = csvHeader + csvData;
    fs.writeFileSync(filename, fullCSV);

    console.log(`📄 File CSV generato: ${filename}`);
    return filename;
  }

  /**
   * Invia richiesta FOTA di massa
   */
  async sendMassFOTARequest(devices) {
    console.log(
      `📧 Invio richiesta FOTA di massa per ${devices.length} dispositivi...`
    );

    if (!this.transporter) {
      const initialized = await this.initializeEmailTransporter();
      if (!initialized) {
        throw new Error("Impossibile inizializzare trasportatore email");
      }
    }

    // Genera contenuto email
    const emailContent = this.generateFOTARequestEmail(devices);

    // Genera file CSV allegato
    const csvFilename = `device_list_${Date.now()}.csv`;
    const csvPath = this.generateDeviceCSV(devices, csvFilename);

    const results = [];

    // Invia email a tutti i contatti del produttore
    for (const recipient of this.manufacturerContacts) {
      try {
        console.log(`📤 Invio a: ${recipient}`);

        const mailOptions = {
          from: this.config.email.from,
          to: recipient,
          subject: emailContent.subject,
          text: emailContent.textContent,
          html: emailContent.htmlContent,
          attachments: [
            {
              filename: "device_list.csv",
              path: csvPath,
            },
          ],
        };

        const info = await this.transporter.sendMail(mailOptions);

        console.log(`✅ Email inviata a ${recipient}: ${info.messageId}`);
        results.push({
          recipient,
          success: true,
          messageId: info.messageId,
        });

        // Pausa tra invii per evitare spam detection
        await this.delay(2000);
      } catch (error) {
        console.error(`❌ Errore invio a ${recipient}:`, error.message);
        results.push({
          recipient,
          success: false,
          error: error.message,
        });
      }
    }

    // Pulisci file temporaneo
    fs.unlinkSync(csvPath);

    return results;
  }

  /**
   * Invia email di follow-up
   */
  async sendFollowUpEmail(originalResults) {
    console.log("📧 Invio email di follow-up...");

    const followUpSubject =
      "FOLLOW-UP: Urgent Mass FOTA Request - Healthcare GPS Watches";

    const followUpContent = `
Dear Technical Team,

This is a follow-up to my urgent request for Mass FOTA configuration sent earlier today.

SITUATION UPDATE:
- ${
      originalResults.filter((r) => r.success).length
    } emails delivered successfully
- Still awaiting response for critical healthcare deployment
- Patient safety monitoring depends on immediate action

REMINDER - WHAT I NEED:
1. Mass FOTA for ${this.config.business.contractValue} healthcare contract
2. Standard protocol firmware (no AQSH+ encryption)
3. Server configuration: ${this.config.targetServer.ip}:${
      this.config.targetServer.port
    }

URGENCY LEVEL: CRITICAL
This affects elderly patient safety monitoring in Italy.

Please prioritize this request and respond within 12 hours.

Thank you,
${this.config.business.contact}
${this.config.business.email}
${this.config.business.phone}
`;

    const results = [];

    for (const contact of this.manufacturerContacts) {
      try {
        const mailOptions = {
          from: this.config.email.from,
          to: contact,
          subject: followUpSubject,
          text: followUpContent,
        };

        const info = await this.transporter.sendMail(mailOptions);
        results.push({
          recipient: contact,
          success: true,
          messageId: info.messageId,
        });

        await this.delay(1000);
      } catch (error) {
        results.push({
          recipient: contact,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Genera report risultati
   */
  generateReport(results) {
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log("\n📊 REPORT INVIO EMAIL:");
    console.log("═".repeat(50));
    console.log(`📧 Email inviate: ${results.length}`);
    console.log(`✅ Successi: ${successful}`);
    console.log(`❌ Fallimenti: ${failed}`);
    console.log(
      `📈 Tasso successo: ${((successful / results.length) * 100).toFixed(1)}%`
    );

    if (successful > 0) {
      console.log("\n✅ EMAIL INVIATE CON SUCCESSO:");
      results
        .filter((r) => r.success)
        .forEach((result) => {
          console.log(`   • ${result.recipient} (${result.messageId})`);
        });
    }

    if (failed > 0) {
      console.log("\n❌ EMAIL FALLITE:");
      results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`   • ${result.recipient}: ${result.error}`);
        });
    }

    console.log("═".repeat(50));
  }

  /**
   * Utility: delay
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Funzione principale
 */
async function main() {
  console.log("📧 SISTEMA RICHIESTA FOTA DI MASSA");
  console.log("═".repeat(60));

  try {
    // Verifica variabili d'ambiente
    const requiredEnvVars = [
      "EMAIL_USER",
      "EMAIL_PASSWORD",
      "EMAIL_FROM",
      "BUSINESS_EMAIL",
    ];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      console.error("❌ Variabili d'ambiente mancanti:");
      missingVars.forEach((varName) => console.log(`   • ${varName}`));
      console.log("\nConfigura le variabili d'ambiente:");
      console.log('export EMAIL_USER="your_email@gmail.com"');
      console.log('export EMAIL_PASSWORD="your_app_password"');
      console.log('export EMAIL_FROM="your_email@gmail.com"');
      console.log('export BUSINESS_EMAIL="your_business@email.com"');
      process.exit(1);
    }

    // Configurazione
    const config = {
      emailUser: process.env.EMAIL_USER,
      emailPassword: process.env.EMAIL_PASSWORD,
      emailFrom: process.env.EMAIL_FROM,
      businessEmail: process.env.BUSINESS_EMAIL,
      businessPhone: process.env.BUSINESS_PHONE || "+39 XXX XXX XXXX",
      businessContact: process.env.BUSINESS_CONTACT || "Fabio Marchetti",
    };

    // Inizializza sistema
    const fotaSystem = new FOTAMassRequest(config);

    // File dispositivi
    const deviceFile = process.argv[2] || "device_list_example.csv";

    if (!fs.existsSync(deviceFile)) {
      console.error(`❌ File dispositivi non trovato: ${deviceFile}`);
      process.exit(1);
    }

    // Carica dispositivi
    const devices = await fotaSystem.loadDeviceList(deviceFile);

    if (devices.length === 0) {
      console.error("❌ Nessun dispositivo trovato nel file CSV");
      process.exit(1);
    }

    // Conferma invio
    console.log(
      `\n⚠️ Stai per inviare richiesta FOTA per ${devices.length} dispositivi.`
    );
    console.log("Destinatari:", fotaSystem.manufacturerContacts.join(", "));
    console.log(
      "Premi CTRL+C per annullare, o attendi 10 secondi per continuare..."
    );

    await fotaSystem.delay(10000);

    // Invia richiesta
    const results = await fotaSystem.sendMassFOTARequest(devices);

    // Genera report
    fotaSystem.generateReport(results);

    // Programma follow-up automatico
    console.log("\n⏰ Follow-up programmato tra 24 ore...");
    setTimeout(async () => {
      console.log("📧 Invio follow-up automatico...");
      const followUpResults = await fotaSystem.sendFollowUpEmail(results);
      fotaSystem.generateReport(followUpResults);
    }, 24 * 60 * 60 * 1000); // 24 ore

    console.log("\n🎉 Richiesta FOTA di massa inviata con successo!");
    console.log("💡 Monitora la tua email per le risposte del produttore.");
  } catch (error) {
    console.error("💥 Errore critico:", error.message);
    process.exit(1);
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Errore fatale:", error);
    process.exit(1);
  });
}

module.exports = FOTAMassRequest;
