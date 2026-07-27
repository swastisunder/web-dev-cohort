class Cricketer {
  constructor(name, role) {
    this.name = name;
    this.role = role;
    this.matchsPlayed = 0;
    this.stamina = 100;
  }

  introduce() {
    return `${this.name} the ${this.role} | matches played: ${this.matchsPlayed} | stamina: ${this.stamina}`;
  }
}

const player1 = new Cricketer("Virat", "Batsman");
const player2 = new Cricketer("Bumrah", "Blower");

console.log(player1.hasOwnProperty("name"));
console.log(typeof Cricketer);
console.log(typeof player1);
