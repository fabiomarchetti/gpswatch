const crypto = require("crypto");

/**
 * DECODER SPERIMENTALE PER PROTOCOLLO AQSH+
 *
 * Basato sull'analisi dei dati ricevuti:
 * ff41515348002b0100000027b6b5d4fc...
 *
 * Struttura identificata:
 * - ff: Marker inizio
 * - 41515348: 'AQSH' header
 * - 002b: Lunghezza payload (43 bytes)
 * - Resto: Dati criptati
 */

class AQSHDecoder {
  constructor() {
    // Possibili chiavi AES comuni usate da produttori cinesi
    this.commonKeys = [
      "0123456789abcdef0123456789abcdef", // Chiave test comune
      "1234567890123456", // Chiave semplice 16 byte
      "setracker2024key16", // Basata su SeTracker
      "wonlex2024gpskey16", // Basata su Wonlex
      "gpswatch2024key16", // Generica GPS
      "4ptouch2024key1234", // Basata su 4P-Touch
    ];

    // Possibili IV (Initialization Vector)
    this.commonIVs = [
      "0000000000000000", // IV zero
      "1234567890123456", // IV semplice
      Buffer.alloc(16, 0), // Buffer zero
    ];
  }

  /**
   * Analizza l'header AQSH+ e estrae i componenti
   */
  parseAQSHHeader(data) {
    if (data.length < 8) return null;

    const marker = data[0];
    const header = data.slice(1, 5).toString("ascii");
    const length = data.readUInt16BE(5);

    return {
      marker: marker.toString(16),
      header,
      payloadLength: length,
      payload: data.slice(7, 7 + length),
      isValid: header === "AQSH" && marker === 0xff,
    };
  }

  /**
   * Tenta decrittazione con diverse chiavi AES
   */
  tryDecryptAES(encryptedData, algorithm = "aes-128-cbc") {
    const results = [];

    for (const keyHex of this.commonKeys) {
      for (const iv of this.commonIVs) {
        try {
          const key = Buffer.from(keyHex.slice(0, 32), "hex");
          const ivBuffer =
            typeof iv === "string"
              ? Buffer.from(iv.slice(0, 32), "hex")
              : iv.slice(0, 16);

          const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
          decipher.setAutoPadding(false);

          let decrypted = decipher.update(encryptedData);
          decrypted = Buffer.concat([decrypted, decipher.final()]);

          // Verifica se il risultato sembra un protocollo GPS valido
          const decryptedStr = decrypted.toString(
            "ascii",
            0,
            Math.min(50, decrypted.length)
          );

          if (this.looksLikeGPSProtocol(decryptedStr)) {
            results.push({
              key: keyHex,
              iv: iv.toString("hex"),
              algorithm,
              decrypted: decryptedStr,
              fullDecrypted: decrypted,
              confidence: this.calculateConfidence(decryptedStr),
            });
          }
        } catch (err) {
          // Ignora errori di decrittazione
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Verifica se il testo decrittato assomiglia al protocollo GPS
   */
  looksLikeGPSProtocol(text) {
    const gpsPatterns = [
      /\[.*\*.*\*.*\*.*\]/, // Formato [PROTO*ID*LEN*CMD]
      /LK,/, // Comando heartbeat
      /UD,/, // Comando posizione
      /AL,/, // Comando allarme
      /bphrt,/, // Comando salute
      /oxygen,/, // Comando SpO2
      /btemp2,/, // Comando temperatura
    ];

    return gpsPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Calcola un punteggio di confidenza per il testo decrittato
   */
  calculateConfidence(text) {
    let score = 0;

    // Presenza di caratteri stampabili
    const printableChars = text.match(/[a-zA-Z0-9\[\]*,.-]/g);
    if (printableChars) score += printableChars.length;

    // Presenza di pattern GPS
    if (/\[.*\*.*\*.*\*.*\]/.test(text)) score += 50;
    if (/LK,|UD,|AL,/.test(text)) score += 30;
    if (/\d{15}/.test(text)) score += 20; // IMEI
    if (/\d{2},\d{2},\d{2}/.test(text)) score += 15; // Coordinate

    return score;
  }

  /**
   * Tenta decrittazione XOR semplice
   */
  tryXORDecryption(data) {
    const results = [];

    // Prova chiavi XOR comuni
    const xorKeys = [0x55, 0xaa, 0xff, 0x00, 0x42, 0x69];

    for (const key of xorKeys) {
      const decrypted = Buffer.alloc(data.length);
      for (let i = 0; i < data.length; i++) {
        decrypted[i] = data[i] ^ key;
      }

      const decryptedStr = decrypted.toString(
        "ascii",
        0,
        Math.min(50, decrypted.length)
      );
      if (this.looksLikeGPSProtocol(decryptedStr)) {
        results.push({
          method: "XOR",
          key: `0x${key.toString(16)}`,
          decrypted: decryptedStr,
          fullDecrypted: decrypted,
          confidence: this.calculateConfidence(decryptedStr),
        });
      }
    }

    return results;
  }

  /**
   * Funzione principale per decodificare dati AQSH+
   */
  decode(hexData) {
    console.log("🔍 Analisi dati AQSH+...");
    console.log(`📊 Dati hex: ${hexData.substring(0, 100)}...`);

    const data = Buffer.from(hexData, "hex");
    const header = this.parseAQSHHeader(data);

    if (!header || !header.isValid) {
      console.log("❌ Header AQSH+ non valido");
      return null;
    }

    console.log("✅ Header AQSH+ valido:");
    console.log(`   Marker: 0x${header.marker}`);
    console.log(`   Header: ${header.header}`);
    console.log(`   Payload Length: ${header.payloadLength} bytes`);

    // Tenta decrittazione AES
    console.log("\n🔐 Tentativo decrittazione AES...");
    const aesResults = this.tryDecryptAES(header.payload);

    if (aesResults.length > 0) {
      console.log(
        `✅ Trovate ${aesResults.length} possibili decrittazioni AES:`
      );
      aesResults.slice(0, 3).forEach((result, i) => {
        console.log(`\n   ${i + 1}. Chiave: ${result.key}`);
        console.log(`      IV: ${result.iv}`);
        console.log(`      Confidenza: ${result.confidence}`);
        console.log(`      Risultato: ${result.decrypted}`);
      });
      return aesResults[0];
    }

    // Tenta decrittazione XOR
    console.log("\n🔀 Tentativo decrittazione XOR...");
    const xorResults = this.tryXORDecryption(header.payload);

    if (xorResults.length > 0) {
      console.log(
        `✅ Trovate ${xorResults.length} possibili decrittazioni XOR:`
      );
      xorResults.forEach((result, i) => {
        console.log(`\n   ${i + 1}. Metodo: ${result.method}`);
        console.log(`      Chiave: ${result.key}`);
        console.log(`      Confidenza: ${result.confidence}`);
        console.log(`      Risultato: ${result.decrypted}`);
      });
      return xorResults[0];
    }

    console.log("❌ Nessuna decrittazione riuscita");
    return null;
  }
}

// Test con i dati del documento
if (require.main === module) {
  const decoder = new AQSHDecoder();

  // Dati di esempio dal documento
  const testData = "ff41515348002b0100000027b6b5d4fc";

  console.log("🧪 TEST DECODER AQSH+");
  console.log("=".repeat(50));

  const result = decoder.decode(testData);

  if (result) {
    console.log("\n🎉 DECRITTAZIONE RIUSCITA!");
    console.log(`Metodo: ${result.algorithm || result.method}`);
    console.log(`Chiave: ${result.key}`);
    console.log(`Risultato: ${result.decrypted}`);
  } else {
    console.log("\n❌ Decrittazione fallita");
    console.log("💡 Suggerimenti:");
    console.log("   1. Contatta il produttore per la chiave AES");
    console.log("   2. Richiedi firmware senza crittografia");
    console.log("   3. Analizza più campioni di dati");
  }
}

module.exports = AQSHDecoder;
