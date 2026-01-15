#!/usr/bin/env node

/**
 * 📱 TEST COMANDI SMS PER OROLOGIO GPS
 *
 * Questo script testa se l'orologio C405_KYS_S5_V1.3_2025 risponde
 * ai comandi SMS standard per estrarre dati sanitari.
 *
 * IMEI: 863737078055392
 * Numero SIM orologio: DA CONFIGURARE
 */

const twilio = require("twilio");
const readline = require("readline");

// Configurazione Twilio (da configurare)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "your_account_sid";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "your_auth_token";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+393123456789";

// Numero SIM dell'orologio (da configurare)
const WATCH_PHONE_NUMBER = process.env.WATCH_PHONE_NUMBER || "+393987654321";

// Password orologio (default comune)
const WATCH_PASSWORD = process.env.WATCH_PASSWORD || "123456";

class SMSWatchTester {
  constructor() {
    this.client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * 📋 Lista comandi SMS standard per orologi GPS
   */
  getStandardCommands() {
    return {
      // Comandi base
      position: `pw,${WATCH_PASSWORD},ts#`, // Richiesta posizione
      health: `pw,${WATCH_PASSWORD},health#`, // Dati sanitari
      battery: `pw,${WATCH_PASSWORD},bat#`, // Stato batteria
      status: `pw,${WATCH_PASSWORD},status#`, // Status generale

      // Comandi specifici salute
      heartrate: `pw,${WATCH_PASSWORD},hrt#`, // Solo frequenza cardiaca
      bloodpressure: `pw,${WATCH_PASSWORD},bp#`, // Solo pressione
      oxygen: `pw,${WATCH_PASSWORD},spo2#`, // Solo saturazione
      temperature: `pw,${WATCH_PASSWORD},temp#`, // Solo temperatura

      // Comandi alternativi (varianti comuni)
      locate: `pw,${WATCH_PASSWORD},locate#`, // Posizione alternativa
      info: `pw,${WATCH_PASSWORD},info#`, // Info dispositivo
      version: `pw,${WATCH_PASSWORD},ver#`, // Versione firmware

      // Comandi senza password (alcuni orologi)
      simple_pos: "ts#", // Posizione semplice
      simple_health: "health#", // Salute semplice

      // Comandi specifici produttore
      wonlex_health: `pw,${WATCH_PASSWORD},bphrt#`, // Wonlex health
      setracker_pos: `pw,${WATCH_PASSWORD},cr#`, // SeTracker position
    };
  }

  /**
   * 📤 Invia comando SMS all'orologio
   */
  async sendCommand(commandName, command) {
    try {
      console.log(`\n📤 Invio comando "${commandName}": ${command}`);
      console.log(`📱 A numero: ${WATCH_PHONE_NUMBER}`);

      const message = await this.client.messages.create({
        body: command,
        from: TWILIO_PHONE_NUMBER,
        to: WATCH_PHONE_NUMBER,
      });

      console.log(`✅ SMS inviato con successo!`);
      console.log(`📋 Message SID: ${message.sid}`);
      console.log(`⏰ Attendi 30-60 secondi per la risposta...`);

      return message;
    } catch (error) {
      console.error(`❌ Errore invio SMS:`, error.message);
      return null;
    }
  }

  /**
   * 📥 Configura webhook per ricevere risposte SMS
   */
  setupWebhook() {
    const express = require("express");
    const app = express();

    app.use(express.urlencoded({ extended: false }));

    app.post("/sms/webhook", (req, res) => {
      const { From, Body, MessageSid } = req.body;

      console.log(`\n📥 RISPOSTA SMS RICEVUTA!`);
      console.log(`📱 Da: ${From}`);
      console.log(`📋 Messaggio: ${Body}`);
      console.log(`🆔 SID: ${MessageSid}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

      // Analizza risposta
      this.analyzeResponse(Body);

      res.status(200).send("OK");
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`\n🌐 Webhook server attivo su porta ${port}`);
      console.log(`📡 URL webhook: http://your-domain.com:${port}/sms/webhook`);
      console.log(`⚙️  Configura questo URL in Twilio Console`);
    });
  }

  /**
   * 🔍 Analizza risposta dell'orologio
   */
  analyzeResponse(responseBody) {
    console.log(`\n🔍 ANALISI RISPOSTA:`);

    // Cerca pattern dati posizione
    const positionPattern = /lat:([\d.-]+),lng:([\d.-]+)/i;
    const posMatch = responseBody.match(positionPattern);
    if (posMatch) {
      console.log(`📍 POSIZIONE TROVATA:`);
      console.log(`   Latitudine: ${posMatch[1]}`);
      console.log(`   Longitudine: ${posMatch[2]}`);
    }

    // Cerca pattern dati salute
    const healthPatterns = {
      heartRate: /hr:(\d+)/i,
      bloodPressure: /bp:(\d+\/\d+)/i,
      spO2: /spo2:(\d+)/i,
      temperature: /temp:([\d.]+)/i,
      battery: /bat(?:tery)?:(\d+)%?/i,
    };

    console.log(`🏥 DATI SANITARI:`);
    for (const [param, pattern] of Object.entries(healthPatterns)) {
      const match = responseBody.match(pattern);
      if (match) {
        console.log(`   ${param}: ${match[1]}`);
      }
    }

    // Cerca altri pattern utili
    const otherPatterns = {
      imei: /imei:(\d+)/i,
      version: /ver(?:sion)?:([\w.-]+)/i,
      signal: /signal:(\d+)/i,
      time: /time:([\d\s:-]+)/i,
    };

    console.log(`📊 ALTRI DATI:`);
    for (const [param, pattern] of Object.entries(otherPatterns)) {
      const match = responseBody.match(pattern);
      if (match) {
        console.log(`   ${param}: ${match[1]}`);
      }
    }

    // Salva risposta per analisi
    this.saveResponse(responseBody);
  }

  /**
   * 💾 Salva risposta per analisi futura
   */
  saveResponse(response) {
    const fs = require("fs");
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${response}\n`;

    fs.appendFileSync("sms_responses.log", logEntry);
    console.log(`💾 Risposta salvata in sms_responses.log`);
  }

  /**
   * 🎮 Menu interattivo
   */
  async showMenu() {
    const commands = this.getStandardCommands();

    console.log(`\n🎮 MENU COMANDI SMS`);
    console.log(`==================`);

    const commandList = Object.keys(commands);
    commandList.forEach((cmd, index) => {
      console.log(`${index + 1}. ${cmd} - ${commands[cmd]}`);
    });

    console.log(`${commandList.length + 1}. Test tutti i comandi`);
    console.log(`${commandList.length + 2}. Configura webhook`);
    console.log(`0. Esci`);

    return new Promise((resolve) => {
      this.rl.question("\n🔢 Scegli comando (numero): ", (answer) => {
        const choice = parseInt(answer);

        if (choice === 0) {
          console.log("👋 Arrivederci!");
          process.exit(0);
        } else if (choice === commandList.length + 1) {
          resolve("test_all");
        } else if (choice === commandList.length + 2) {
          resolve("setup_webhook");
        } else if (choice >= 1 && choice <= commandList.length) {
          const commandName = commandList[choice - 1];
          resolve(commandName);
        } else {
          console.log("❌ Scelta non valida");
          resolve(null);
        }
      });
    });
  }

  /**
   * 🧪 Testa tutti i comandi
   */
  async testAllCommands() {
    const commands = this.getStandardCommands();

    console.log(`\n🧪 TEST AUTOMATICO TUTTI I COMANDI`);
    console.log(`==================================`);

    for (const [name, command] of Object.entries(commands)) {
      await this.sendCommand(name, command);

      // Attendi 10 secondi tra un comando e l'altro
      console.log(`⏳ Attendo 10 secondi prima del prossimo comando...`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    console.log(
      `\n✅ Test completato! Controlla le risposte nei prossimi minuti.`
    );
  }

  /**
   * ⚙️ Verifica configurazione
   */
  checkConfiguration() {
    console.log(`\n⚙️ VERIFICA CONFIGURAZIONE`);
    console.log(`=========================`);

    const config = {
      "Twilio Account SID": TWILIO_ACCOUNT_SID,
      "Twilio Auth Token": TWILIO_AUTH_TOKEN
        ? "***configurato***"
        : "❌ MANCANTE",
      "Numero Twilio": TWILIO_PHONE_NUMBER,
      "Numero Orologio": WATCH_PHONE_NUMBER,
      "Password Orologio": WATCH_PASSWORD,
    };

    for (const [key, value] of Object.entries(config)) {
      console.log(`${key}: ${value}`);
    }

    if (TWILIO_ACCOUNT_SID === "your_account_sid") {
      console.log(`\n❌ CONFIGURAZIONE MANCANTE!`);
      console.log(`📋 Configura le variabili d'ambiente:`);
      console.log(`   export TWILIO_ACCOUNT_SID="your_actual_sid"`);
      console.log(`   export TWILIO_AUTH_TOKEN="your_actual_token"`);
      console.log(`   export TWILIO_PHONE_NUMBER="+393123456789"`);
      console.log(`   export WATCH_PHONE_NUMBER="+393987654321"`);
      return false;
    }

    return true;
  }

  /**
   * 🚀 Avvia il tester
   */
  async start() {
    console.log(`\n📱 SMS WATCH TESTER`);
    console.log(`==================`);
    console.log(`🎯 Target: Orologio C405_KYS_S5_V1.3_2025`);
    console.log(`📋 IMEI: 863737078055392`);

    if (!this.checkConfiguration()) {
      process.exit(1);
    }

    while (true) {
      const choice = await this.showMenu();

      if (!choice) continue;

      if (choice === "test_all") {
        await this.testAllCommands();
      } else if (choice === "setup_webhook") {
        this.setupWebhook();
        break;
      } else {
        const commands = this.getStandardCommands();
        await this.sendCommand(choice, commands[choice]);
      }

      console.log(`\n⏳ Premi ENTER per continuare...`);
      await new Promise((resolve) => {
        this.rl.question("", () => resolve());
      });
    }
  }
}

// 🚀 Avvia il tester se eseguito direttamente
if (require.main === module) {
  const tester = new SMSWatchTester();
  tester.start().catch(console.error);
}

module.exports = SMSWatchTester;
