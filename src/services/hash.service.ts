import crypto from 'crypto';

interface ReturnHash {
  hash: string;
  salt: string;
}

export class HashService {
  async crypto(password: string, _salt?: string): Promise<ReturnHash> {
    return await new Promise((resolve, reject) => {
      const salt = Buffer.from('adasdadsada').toString('hex');
      crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          hash: result.toString('hex'),
          salt,
        });
      });
    });
  }

  async compareHash(passowordHash: string, password: string, salt?: string): Promise<boolean> {
    const { hash } = await this.crypto(password, salt);
    return passowordHash === hash;
  }
}
