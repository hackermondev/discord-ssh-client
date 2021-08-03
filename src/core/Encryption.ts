import crypto from 'crypto';

class Encryption {
  private algorithm: string;
  private key: string;

  constructor(key: string, algorithm?: string | undefined) {
    this.key = key;
    this.algorithm = algorithm || 'aes256';
  }

  encrypt(text: string): string {
    var cipher = crypto.createCipher(this.algorithm, this.key);
    var encrypted: string =
      cipher.update(text, 'utf8', 'hex') + cipher.final('hex');

    return encrypted;
  }

  decrypt(text: string): string {
    var cipher = crypto.createDecipher(this.algorithm, this.key);
    var decrypted: string =
      cipher.update(text, 'hex', 'utf8') + cipher.final('utf8');

    return decrypted;
  }
}

export default Encryption;
