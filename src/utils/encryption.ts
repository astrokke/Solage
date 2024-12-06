import { PublicKey } from "@solana/web3.js";
import { box, randomBytes } from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

export class MessageEncryption {
  private static convertPublicKey(publicKey: string): Uint8Array {
    return new PublicKey(publicKey).toBytes();
  }

  static generateKeyPair() {
    return box.keyPair();
  }

  static encrypt(
    message: string,
    recipientPublicKey: string,
    senderSecretKey: Uint8Array
  ): string {
    const ephemeralKeyPair = box.keyPair();
    const nonce = randomBytes(box.nonceLength);
    const messageUint8 = new TextEncoder().encode(message);

    const encryptedMessage = box(
      messageUint8,
      nonce,
      this.convertPublicKey(recipientPublicKey),
      senderSecretKey
    );

    const fullMessage = new Uint8Array(nonce.length + encryptedMessage.length);
    fullMessage.set(nonce);
    fullMessage.set(encryptedMessage, nonce.length);

    return encodeBase64(fullMessage);
  }

  static decrypt(
    encryptedMessage: string,
    senderPublicKey: string,
    recipientSecretKey: Uint8Array
  ): string {
    const messageWithNonce = decodeBase64(encryptedMessage);
    const nonce = messageWithNonce.slice(0, box.nonceLength);
    const message = messageWithNonce.slice(box.nonceLength);

    const decrypted = box.open(
      message,
      nonce,
      this.convertPublicKey(senderPublicKey),
      recipientSecretKey
    );

    if (!decrypted) {
      throw new Error("Échec du déchiffrement du message");
    }

    return new TextDecoder().decode(decrypted);
  }
}
