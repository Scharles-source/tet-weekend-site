export class SaisieInvalide extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaisieInvalide";
  }
}
