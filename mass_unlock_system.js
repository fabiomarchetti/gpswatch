#!/usr/bin/env node

/**
 * SISTEMA DI SBLOCCO AUTOMATIZZATO PER OROLOGI GPS
 *
 * Questo script automatizza il processo di sblocco di centinaia di orologi GPS
 * utilizzando l'API del produttore o simulando le richieste web.
 *
 * Autore: Fabio Marchetti
 * Data: 1 Gennaio 2026
 * Progetto: GPS Tracker - Sblocco Automatico
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

class MassUnlockSystem {
  constructor(config = {}) {
    this.config = {
      // Configurazione server di destinazione
      targetServer: {
        ip: config.serverIP || "91.99.141.225",
        port: config.serverPort || 8001,
        protocol: config.protocol || "standard",
      },

      // Configurazione API produttore
      api: {
        baseURL: config.apiURL || "https://api.setracker.com",
        timeout: config.timeout || 30000,
        retries: config.retries || 3,
      },

      // Configurazione batch processing
      batch: {
        size: config.batchSize || 10,
        delayMs: config.batchDelay || 5000,
      },

      // Credenziali (da configurare)
      credentials: {
        username: config.username || process.env.SETRACKER_USERNAME,
        password: config.password || process.env.SETRACKER_PASSWORD,
        dealerCode: config.dealerCode || process.env.DEALER_CODE,
      },
    };

    this.authToken = null;
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
    };
  }

  /**
   * Autentica con il sistema del produttore
   */
  async authenticate() {
    console.log("🔐 Autenticazione in corso...");

    try {
      const response = await axios.post(
        `${this.config.api.baseURL}/auth/login`,
        {
          username: this.config.credentials.username,
          password: this.config.credentials.password,
          dealerCode: this.config.credentials.dealerCode,
        },
        {
          timeout: this.config.api.timeout,
        }
      );

      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        console.log("✅ Autenticazione riuscita");
        return true;
      } else {
        throw new Error("Token non ricevuto");
      }
    } catch (error) {
      console.error("❌ Errore autenticazione:", error.message);

      // Prova metodi alternativi di autenticazione
      return await this.tryAlternativeAuth();
    }
  }

  /**
   * Prova metodi alternativi di autenticazione
   */
  async tryAlternativeAuth() {
    console.log("🔄 Tentativo autenticazione alternativa...");

    // Metodo 1: API SeTracker alternativa
    try {
      const response = await axios.post("https://www.setracker.com/api/login", {
        account: this.config.credentials.username,
        password: this.config.credentials.password,
      });

      if (response.data && response.data.success) {
        this.authToken = response.data.token || response.data.sessionId;
        console.log("✅ Autenticazione alternativa riuscita");
        return true;
      }
    } catch (error) {
      console.log("⚠️ Metodo alternativo 1 fallito");
    }

    // Metodo 2: Simulazione web login
    try {
      const loginPage = await axios.get("https://www.setracker.com/login");
      const cookies = loginPage.headers["set-cookie"];

      const loginResponse = await axios.post(
        "https://www.setracker.com/login",
        {
          username: this.config.credentials.username,
          password: this.config.credentials.password,
        },
        {
          headers: {
            Cookie: cookies?.join("; "),
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      );

      if (loginResponse.status === 200) {
        this.authToken = "web_session";
        console.log("✅ Autenticazione web riuscita");
        return true;
      }
    } catch (error) {
      console.log("⚠️ Metodo alternativo 2 fallito");
    }

    console.error("❌ Tutti i metodi di autenticazione falliti");
    return false;
  }

  /**
   * Sblocca un singolo dispositivo
   */
  async unlockDevice(device, retryCount = 0) {
    const { imei, registrationCode, model } = device;

    try {
      console.log(`🔓 Sblocco dispositivo: ${imei}`);

      const unlockData = {
        imei: imei,
        registrationCode: registrationCode,
        model: model || "C405_KYS_S5",
        serverConfig: {
          ip: this.config.targetServer.ip,
          port: this.config.targetServer.port,
          protocol: this.config.targetServer.protocol,
        },
        settings: {
          uploadInterval: 30, // 30 secondi
          healthMonitoring: true,
          gpsMode: "continuous",
          timezone: "Europe/Rome",
        },
        reason: "Healthcare monitoring for elderly patients - GDPR compliant",
      };

      // Prova diversi endpoint API
      const endpoints = [
        "/api/device/unlock",
        "/api/devices/configure",
        "/device/unlock",
        "/unlock",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.post(
            `${this.config.api.baseURL}${endpoint}`,
            unlockData,
            {
              headers: {
                Authorization: `Bearer ${this.authToken}`,
                "Content-Type": "application/json",
                "User-Agent": "GPS-Tracker-System/1.0",
              },
              timeout: this.config.api.timeout,
            }
          );

          if (response.status === 200 && response.data.success) {
            console.log(`✅ Dispositivo ${imei} sbloccato con successo`);
            this.stats.successful++;
            return {
              success: true,
              imei,
              message: "Unlocked successfully",
              endpoint,
              response: response.data,
            };
          }
        } catch (endpointError) {
          // Continua con il prossimo endpoint
          continue;
        }
      }

      throw new Error("Nessun endpoint funzionante trovato");
    } catch (error) {
      console.error(`❌ Errore sblocco ${imei}:`, error.message);

      // Retry logic
      if (retryCount < this.config.api.retries) {
        console.log(
          `🔄 Retry ${retryCount + 1}/${this.config.api.retries} per ${imei}`
        );
        await this.delay(2000); // Attendi 2 secondi
        return await this.unlockDevice(device, retryCount + 1);
      }

      this.stats.failed++;
      return {
        success: false,
        imei,
        error: error.message,
        retries: retryCount,
      };
    }
  }

  /**
   * Sblocca tutti i dispositivi da una lista
   */
  async unlockAllDevices(devices) {
    console.log(`🚀 Inizio sblocco di ${devices.length} dispositivi`);

    if (!this.authToken) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        throw new Error("Autenticazione fallita - impossibile procedere");
      }
    }

    this.stats.total = devices.length;
    const results = [];
    const batchSize = this.config.batch.size;

    for (let i = 0; i < devices.length; i += batchSize) {
      const batch = devices.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(devices.length / batchSize);

      console.log(
        `\n📦 Processando batch ${batchNumber}/${totalBatches} (${batch.length} dispositivi)`
      );

      // Processa batch in parallelo
      const batchPromises = batch.map((device) => this.unlockDevice(device));
      const batchResults = await Promise.allSettled(batchPromises);

      // Elabora risultati batch
      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          console.error(
            `❌ Errore critico per dispositivo ${batch[index].imei}:`,
            result.reason
          );
          results.push({
            success: false,
            imei: batch[index].imei,
            error: result.reason.message || "Errore sconosciuto",
          });
          this.stats.failed++;
        }
      });

      // Pausa tra batch per evitare rate limiting
      if (i + batchSize < devices.length) {
        console.log(`⏳ Pausa ${this.config.batch.delayMs / 1000} secondi...`);
        await this.delay(this.config.batch.delayMs);
      }
    }

    return results;
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
          // Supporta diversi formati CSV
          const device = {
            imei: row.IMEI || row.imei || row.Imei,
            registrationCode:
              row.RegistrationCode || row.registration_code || row.RegCode,
            model: row.Model || row.model || "C405_KYS_S5",
            notes: row.Notes || row.notes || "",
          };

          // Valida dati essenziali
          if (device.imei && device.registrationCode) {
            devices.push(device);
          } else {
            console.warn(`⚠️ Riga ignorata - dati mancanti:`, row);
          }
        })
        .on("end", () => {
          console.log(`✅ Caricati ${devices.length} dispositivi validi`);
          resolve(devices);
        })
        .on("error", (error) => {
          console.error("❌ Errore lettura CSV:", error);
          reject(error);
        });
    });
  }

  /**
   * Salva risultati in file CSV
   */
  async saveResults(results, outputFile) {
    console.log(`💾 Salvataggio risultati in: ${outputFile}`);

    const csvWriter = createCsvWriter({
      path: outputFile,
      header: [
        { id: "imei", title: "IMEI" },
        { id: "status", title: "Status" },
        { id: "message", title: "Message" },
        { id: "endpoint", title: "Endpoint" },
        { id: "timestamp", title: "Timestamp" },
      ],
    });

    const csvData = results.map((result) => ({
      imei: result.imei,
      status: result.success ? "SUCCESS" : "FAILED",
      message: result.success ? result.message || "Unlocked" : result.error,
      endpoint: result.endpoint || "N/A",
      timestamp: new Date().toISOString(),
    }));

    await csvWriter.writeRecords(csvData);
    console.log(`✅ Risultati salvati: ${csvData.length} record`);
  }

  /**
   * Genera report statistiche
   */
  generateReport() {
    const successRate = (
      (this.stats.successful / this.stats.total) *
      100
    ).toFixed(1);

    console.log("\n📊 REPORT FINALE:");
    console.log("═".repeat(50));
    console.log(`📱 Dispositivi totali: ${this.stats.total}`);
    console.log(`✅ Sbloccati con successo: ${this.stats.successful}`);
    console.log(`❌ Falliti: ${this.stats.failed}`);
    console.log(`⏭️ Saltati: ${this.stats.skipped}`);
    console.log(`📈 Tasso di successo: ${successRate}%`);
    console.log("═".repeat(50));

    if (this.stats.failed > 0) {
      console.log("\n💡 SUGGERIMENTI PER MIGLIORARE:");
      console.log("• Verifica credenziali API");
      console.log("• Controlla connessione internet");
      console.log("• Riduci dimensione batch");
      console.log("• Aumenta timeout richieste");
    }
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
  console.log("🚀 SISTEMA DI SBLOCCO AUTOMATICO OROLOGI GPS");
  console.log("═".repeat(60));

  try {
    // Configurazione
    const config = {
      serverIP: process.env.SERVER_IP || "91.99.141.225",
      serverPort: process.env.SERVER_PORT || 8001,
      username: process.env.SETRACKER_USERNAME,
      password: process.env.SETRACKER_PASSWORD,
      batchSize: parseInt(process.env.BATCH_SIZE) || 10,
      batchDelay: parseInt(process.env.BATCH_DELAY) || 5000,
    };

    // Verifica configurazione
    if (!config.username || !config.password) {
      console.error("❌ Credenziali mancanti!");
      console.log("Configura le variabili d'ambiente:");
      console.log('export SETRACKER_USERNAME="your_username"');
      console.log('export SETRACKER_PASSWORD="your_password"');
      process.exit(1);
    }

    // Inizializza sistema
    const unlockSystem = new MassUnlockSystem(config);

    // File di input/output
    const inputFile = process.argv[2] || "device_list.csv";
    const outputFile = process.argv[3] || `unlock_results_${Date.now()}.csv`;

    // Verifica file di input
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ File non trovato: ${inputFile}`);
      console.log("Crea un file CSV con colonne: IMEI,RegistrationCode,Model");
      process.exit(1);
    }

    // Carica dispositivi
    const devices = await unlockSystem.loadDeviceList(inputFile);

    if (devices.length === 0) {
      console.error("❌ Nessun dispositivo valido trovato nel file CSV");
      process.exit(1);
    }

    // Conferma prima di procedere
    console.log(`\n⚠️ Stai per sbloccare ${devices.length} dispositivi.`);
    console.log(
      `Server di destinazione: ${config.serverIP}:${config.serverPort}`
    );
    console.log(
      "Premi CTRL+C per annullare, o attendi 10 secondi per continuare..."
    );

    await unlockSystem.delay(10000);

    // Esegui sblocco
    const results = await unlockSystem.unlockAllDevices(devices);

    // Salva risultati
    await unlockSystem.saveResults(results, outputFile);

    // Genera report
    unlockSystem.generateReport();

    console.log(
      `\n🎉 Processo completato! Risultati salvati in: ${outputFile}`
    );
  } catch (error) {
    console.error("💥 Errore critico:", error.message);
    process.exit(1);
  }
}

// Gestione segnali
process.on("SIGINT", () => {
  console.log("\n⚠️ Processo interrotto dall'utente");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⚠️ Processo terminato");
  process.exit(0);
});

// Esegui se chiamato direttamente
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Errore fatale:", error);
    process.exit(1);
  });
}

module.exports = MassUnlockSystem;
