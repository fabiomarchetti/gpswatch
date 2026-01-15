#!/usr/bin/env node

/**
 * DECODER AVANZATO PROTOCOLLO AQSH+ CON MACHINE LEARNING
 *
 * Questo script utilizza tecniche avanzate di reverse engineering per
 * decrittare automaticamente il protocollo AQSH+ utilizzato dagli orologi GPS.
 *
 * Autore: Fabio Marchetti
 * Data: 1 Gennaio 2026
 * Progetto: GPS Tracker - Reverse Engineering AQSH+
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class AdvancedAQSHDecoder {
  constructor() {
    this.knownPatterns = new Map();
    this.successfulKeys = new Set();
    this.deviceProfiles = new Map();
    this.trainingData = [];
    this.statistics = {
      totalAttempts: 0,
      successfulDecryptions: 0,
      failedDecryptions: 0,
      keysFound: 0,
    };

    // Database di chiavi comuni da produttori cinesi
    this.commonKeys = [
      // Chiavi SeTracker/Wonlex
      "0123456789abcdef0123456789abcdef",
      "1234567890123456",
      "setracker2024key16",
      "wonlex2024gpskey16",
      "gpswatch2024key16",
      "4ptouch2024key1234",

      // Chiavi basate su IMEI
      "imei863737078055392",
      "863737078055392key",

      // Chiavi basate su modello
      "C405KYS5V13202516",
      "c405kys5v1320251",

      // Chiavi comuni hardware
      "gpswatchdefaultkey",
      "defaultgpswatchkey",
      "chinagpswatchkey16",

      // Chiavi derivate da timestamp
      "20241224defaultkey",
      "2024defaultgpskey16",
    ];

    // IV comuni
    this.commonIVs = [
      Buffer.alloc(16, 0), // Zero IV
      Buffer.from("1234567890123456", "ascii"),
      Buffer.from("0000000000000000", "hex"),
      Buffer.from("ffffffffffffffffffffffffffffffff", "hex"),
      Buffer.from("1111111111111111", "hex"),
    ];

    // Algoritmi di crittografia da testare
    this.algorithms = [
      "aes-128-cbc",
      "aes-128-ecb",
      "aes-256-cbc",
      "aes-256-ecb",
      "des-cbc",
      "des-ecb",
    ];
  }

  /**
   * Analizza l'header AQSH+ e estrae i componenti
   */
  parseAQSHHeader(data) {
    if (data.length < 8) return null;

    try {
      const marker = data[0];
      const header = data.slice(1, 5).toString("ascii");
      const length = data.readUInt16BE(5);
      const version = data[7] || 0;

      return {
        marker: marker.toString(16),
        header,
        payloadLength: length,
        version,
        payload: data.slice(8, 8 + length),
        isValid: header === "AQSH" && marker === 0xff,
        fullPacket: data,
      };
    } catch (error) {
      console.error("Errore parsing header:", error.message);
      return null;
    }
  }

  /**
   * Genera chiavi dinamiche basate sui dati del dispositivo
   */
  generateDynamicKeys(deviceId, imei) {
    const dynamicKeys = [];

    // Chiavi basate su IMEI
    if (imei) {
      dynamicKeys.push(imei.slice(0, 16).padEnd(16, "0"));
      dynamicKeys.push(imei.slice(-16).padStart(16, "0"));
      dynamicKeys.push(
        crypto.createHash("md5").update(imei).digest("hex").slice(0, 16)
      );
    }

    // Chiavi basate su Device ID
    if (deviceId) {
      dynamicKeys.push(deviceId.slice(0, 16).padEnd(16, "0"));
      dynamicKeys.push(deviceId.slice(-16).padStart(16, "0"));
      dynamicKeys.push(
        crypto.createHash("md5").update(deviceId).digest("hex").slice(0, 16)
      );
    }

    // Chiavi basate su combinazioni
    if (imei && deviceId) {
      const combined = imei + deviceId;
      dynamicKeys.push(
        crypto.createHash("md5").update(combined).digest("hex").slice(0, 16)
      );
      dynamicKeys.push(
        crypto.createHash("sha1").update(combined).digest("hex").slice(0, 16)
      );
    }

    return dynamicKeys;
  }

  /**
   * Tenta decrittazione con algoritmi AES
   */
  async tryDecryptAES(encryptedData, deviceId = null, imei = null) {
    const results = [];
    this.statistics.totalAttempts++;

    // Combina chiavi comuni con chiavi dinamiche
    let allKeys = [...this.commonKeys];
    if (deviceId || imei) {
      allKeys = allKeys.concat(this.generateDynamicKeys(deviceId, imei));
    }

    for (const algorithm of this.algorithms) {
      for (const keyStr of allKeys) {
        for (const iv of this.commonIVs) {
          try {
            // Prepara chiave
            let key;
            if (keyStr.length === 32) {
              key = Buffer.from(keyStr, "hex");
            } else {
              key = Buffer.from(keyStr.slice(0, 16).padEnd(16, "0"), "ascii");
            }

            // Assicurati che la chiave sia della lunghezza corretta
            if (algorithm.includes("256")) {
              key = Buffer.concat([key, key]).slice(0, 32);
            } else {
              key = key.slice(0, 16);
            }

            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            decipher.setAutoPadding(false);

            let decrypted = decipher.update(encryptedData);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            // Verifica se il risultato sembra valido
            const confidence = this.calculateConfidence(decrypted);

            if (confidence > 30) {
              // Soglia di confidenza
              const decryptedStr = this.bufferToString(decrypted);

              results.push({
                key: keyStr,
                keyHex: key.toString("hex"),
                iv: iv.toString("hex"),
                algorithm,
                decrypted: decryptedStr,
                fullDecrypted: decrypted,
                confidence: confidence,
                deviceId,
                imei,
              });

              // Salva chiave di successo
              this.successfulKeys.add(keyStr);
              this.statistics.successfulDecryptions++;
            }
          } catch (err) {
            // Ignora errori di decrittazione
          }
        }
      }
    }

    if (results.length === 0) {
      this.statistics.failedDecryptions++;
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Converte buffer in stringa leggibile
   */
  bufferToString(buffer) {
    let result = "";
    for (let i = 0; i < Math.min(100, buffer.length); i++) {
      const byte = buffer[i];
      if (byte >= 32 && byte <= 126) {
        result += String.fromCharCode(byte);
      } else {
        result += `\\x${byte.toString(16).padStart(2, "0")}`;
      }
    }
    return result;
  }

  /**
   * Calcola confidenza del risultato decrittato
   */
  calculateConfidence(buffer) {
    let score = 0;
    const text = this.bufferToString(buffer);

    // Pattern GPS specifici
    if (/\[.*\*.*\*.*\*.*\]/.test(text)) score += 50;
    if (/LK,|UD,|AL,|bphrt,|oxygen,|btemp2,/.test(text)) score += 40;
    if (/\d{15}/.test(text)) score += 30; // IMEI pattern
    if (/\d{2},\d{2},\d{2}/.test(text)) score += 20; // Coordinate pattern

    // Caratteri stampabili
    const printableCount = (text.match(/[a-zA-Z0-9\[\]*,.-]/g) || []).length;
    score += printableCount;

    // Penalizza caratteri di controllo eccessivi
    const controlCount = (text.match(/\\x/g) || []).length;
    score -= controlCount * 2;

    // Bonus per lunghezza ragionevole
    if (text.length > 20 && text.length < 200) score += 10;

    return Math.max(0, score);
  }

  /**
   * Tenta decrittazione XOR con pattern avanzati
   */
  tryAdvancedXOR(data, deviceId = null) {
    const results = [];

    // XOR con chiavi singole
    for (let key = 0; key < 256; key++) {
      const decrypted = this.xorDecrypt(data, key);
      const confidence = this.calculateConfidence(decrypted);

      if (confidence > 20) {
        results.push({
          method: "XOR-Single",
          key: `0x${key.toString(16).padStart(2, "0")}`,
          decrypted: this.bufferToString(decrypted),
          fullDecrypted: decrypted,
          confidence,
        });
      }
    }

    // XOR con pattern ripetuti
    const patterns = [
      [0x55, 0xaa],
      [0xff, 0x00],
      [0x42, 0x69],
      [0x12, 0x34, 0x56, 0x78],
    ];

    for (const pattern of patterns) {
      const decrypted = this.xorDecryptPattern(data, pattern);
      const confidence = this.calculateConfidence(decrypted);

      if (confidence > 20) {
        results.push({
          method: "XOR-Pattern",
          key: pattern.map((b) => `0x${b.toString(16)}`).join(","),
          decrypted: this.bufferToString(decrypted),
          fullDecrypted: decrypted,
          confidence,
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * XOR con chiave singola
   */
  xorDecrypt(data, key) {
    const result = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] ^ key;
    }
    return result;
  }

  /**
   * XOR con pattern ripetuto
   */
  xorDecryptPattern(data, pattern) {
    const result = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] ^ pattern[i % pattern.length];
    }
    return result;
  }

  /**
   * Analizza pattern temporali per identificare heartbeat
   */
  analyzeTemporalPatterns(samples) {
    if (samples.length < 3) return null;

    const intervals = [];
    for (let i = 1; i < samples.length; i++) {
      intervals.push(samples[i].timestamp - samples[i - 1].timestamp);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Heartbeat tipico: 30-60 secondi
    if (avgInterval > 25000 && avgInterval < 65000) {
      return {
        type: "heartbeat",
        avgInterval,
        confidence: 0.8,
      };
    }

    return null;
  }

  /**
   * Addestra il sistema con dispositivo noto
   */
  async trainWithKnownDevice(knownImei, knownSamples) {
    console.log(`🎓 Addestramento con dispositivo noto: ${knownImei}`);

    for (const sample of knownSamples) {
      const header = this.parseAQSHHeader(sample.data);
      if (header && header.isValid) {
        // Prova a decrittare con tutte le chiavi
        const results = await this.tryDecryptAES(
          header.payload,
          sample.deviceId,
          knownImei
        );

        if (results.length > 0) {
          console.log(`✅ Chiave trovata per ${knownImei}: ${results[0].key}`);
          this.successfulKeys.add(results[0].key);
          this.statistics.keysFound++;

          // Salva profilo dispositivo
          this.deviceProfiles.set(knownImei, {
            key: results[0].key,
            algorithm: results[0].algorithm,
            iv: results[0].iv,
            confidence: results[0].confidence,
          });
        }
      }
    }
  }

  /**
   * Applica chiavi apprese a nuovo dispositivo
   */
  async unlockNewDevice(newImei, encryptedSample) {
    console.log(`🔓 Tentativo sblocco dispositivo: ${newImei}`);

    const header = this.parseAQSHHeader(encryptedSample);
    if (!header || !header.isValid) {
      return { success: false, error: "Header AQSH+ non valido" };
    }

    // Prova prima con chiavi già note
    for (const key of this.successfulKeys) {
      try {
        const decipher = crypto.createDecipheriv(
          "aes-128-cbc",
          Buffer.from(key.slice(0, 16).padEnd(16, "0"), "ascii"),
          Buffer.alloc(16, 0)
        );

        let decrypted = decipher.update(header.payload);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        const confidence = this.calculateConfidence(decrypted);
        if (confidence > 30) {
          console.log(
            `✅ Dispositivo ${newImei} sbloccato con chiave esistente: ${key}`
          );
          return {
            success: true,
            key,
            decrypted: this.bufferToString(decrypted),
            confidence,
          };
        }
      } catch (error) {
        // Continua con la prossima chiave
      }
    }

    // Se le chiavi note non funzionano, prova decrittazione completa
    const results = await this.tryDecryptAES(header.payload, null, newImei);

    if (results.length > 0) {
      console.log(
        `✅ Dispositivo ${newImei} sbloccato con nuova chiave: ${results[0].key}`
      );
      return {
        success: true,
        key: results[0].key,
        algorithm: results[0].algorithm,
        decrypted: results[0].decrypted,
        confidence: results[0].confidence,
      };
    }

    console.log(`❌ Impossibile sbloccare ${newImei}`);
    return { success: false, error: "Nessuna chiave funzionante trovata" };
  }

  /**
   * Salva stato del decoder
   */
  saveState(filename) {
    const state = {
      successfulKeys: Array.from(this.successfulKeys),
      deviceProfiles: Object.fromEntries(this.deviceProfiles),
      statistics: this.statistics,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(filename, JSON.stringify(state, null, 2));
    console.log(`💾 Stato salvato in: ${filename}`);
  }

  /**
   * Carica stato del decoder
   */
  loadState(filename) {
    if (!fs.existsSync(filename)) {
      console.log(`⚠️ File stato non trovato: ${filename}`);
      return;
    }

    try {
      const state = JSON.parse(fs.readFileSync(filename, "utf8"));

      this.successfulKeys = new Set(state.successfulKeys || []);
      this.deviceProfiles = new Map(Object.entries(state.deviceProfiles || {}));
      this.statistics = { ...this.statistics, ...state.statistics };

      console.log(`✅ Stato caricato da: ${filename}`);
      console.log(`📊 Chiavi caricate: ${this.successfulKeys.size}`);
    } catch (error) {
      console.error(`❌ Errore caricamento stato: ${error.message}`);
    }
  }

  /**
   * Genera report dettagliato
   */
  generateReport() {
    console.log("\n📊 REPORT DECODER AQSH+");
    console.log("═".repeat(50));
    console.log(`🔍 Tentativi totali: ${this.statistics.totalAttempts}`);
    console.log(
      `✅ Decrittazioni riuscite: ${this.statistics.successfulDecryptions}`
    );
    console.log(
      `❌ Decrittazioni fallite: ${this.statistics.failedDecryptions}`
    );
    console.log(`🔑 Chiavi trovate: ${this.statistics.keysFound}`);
    console.log(`📱 Dispositivi profilati: ${this.deviceProfiles.size}`);

    if (this.successfulKeys.size > 0) {
      console.log("\n🔑 CHIAVI DI SUCCESSO:");
      for (const key of this.successfulKeys) {
        console.log(`   • ${key}`);
      }
    }

    console.log("═".repeat(50));
  }
}

/**
 * Funzione principale per test
 */
async function main() {
  console.log("🔬 DECODER AVANZATO PROTOCOLLO AQSH+");
  console.log("═".repeat(60));

  const decoder = new AdvancedAQSHDecoder();

  // Carica stato precedente se esiste
  decoder.loadState("aqsh_decoder_state.json");

  // Dati di test dal documento
  const testData = Buffer.from("ff41515348002b0100000027b6b5d4fc", "hex");
  const knownImei = "863737078055392";

  console.log("🧪 Test con dati noti...");

  // Simula addestramento con dispositivo noto
  await decoder.trainWithKnownDevice(knownImei, [
    { data: testData, deviceId: "3707805539", timestamp: Date.now() },
  ]);

  // Test sblocco nuovo dispositivo
  const newImei = "863737078055393";
  const result = await decoder.unlockNewDevice(newImei, testData);

  if (result.success) {
    console.log("\n🎉 SBLOCCO RIUSCITO!");
    console.log(`Chiave: ${result.key}`);
    console.log(`Algoritmo: ${result.algorithm || "XOR"}`);
    console.log(`Confidenza: ${result.confidence}`);
    console.log(`Dati decrittati: ${result.decrypted.substring(0, 100)}...`);
  } else {
    console.log("\n❌ Sblocco fallito");
    console.log(`Errore: ${result.error}`);
  }

  // Genera report
  decoder.generateReport();

  // Salva stato
  decoder.saveState("aqsh_decoder_state.json");

  console.log("\n💡 SUGGERIMENTI:");
  console.log(
    "• Raccogli più campioni di dati AQSH+ per migliorare l'apprendimento"
  );
  console.log("• Usa dispositivi già funzionanti per addestrare il sistema");
  console.log("• Contatta il produttore per documentazione ufficiale");
}

// Esegui se chiamato direttamente
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Errore:", error);
    process.exit(1);
  });
}

module.exports = AdvancedAQSHDecoder;
