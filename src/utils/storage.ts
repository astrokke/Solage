import { AES, enc } from "crypto-js";

export class SecureStorage {
  private static readonly STORAGE_KEY = "encrypted_messages";
  private static readonly VERSION = "1";

  static async saveMessages(messages: any[], publicKey: string) {
    try {
      const data = {
        version: this.VERSION,
        timestamp: Date.now(),
        messages,
      };

      const encrypted = AES.encrypt(JSON.stringify(data), publicKey).toString();

      localStorage.setItem(this.STORAGE_KEY, encrypted);
    } catch (error) {
      console.error("Erreur lors du chiffrement des messages:", error);
    }
  }

  static async loadMessages(publicKey: string) {
    try {
      const encrypted = localStorage.getItem(this.STORAGE_KEY);
      if (!encrypted) return [];

      const decrypted = AES.decrypt(encrypted, publicKey).toString(enc.Utf8);
      const data = JSON.parse(decrypted);

      if (data.version !== this.VERSION) {
        throw new Error("Version de stockage incompatible");
      }

      // Vérifier si les messages ont expiré (1 heure)
      if (Date.now() - data.timestamp > 3600000) {
        localStorage.removeItem(this.STORAGE_KEY);
        return [];
      }

      return data.messages;
    } catch (error) {
      console.error("Erreur lors du déchiffrement des messages:", error);
      return [];
    }
  }
}
