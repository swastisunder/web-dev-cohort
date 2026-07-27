type UserId = string;
interface User {
  id: UserId;
  fname: string;
  lname?: string;
  email: string;
  contact: {
    mobile: string;
  };
  address: {
    street: number;
    pin: number;
    country: string;
  };
}

class InMemoryDB {
  private _db: Map<UserId, User> = new Map();

  constructor() {}

  public insertUser(data: User): UserId {
    if (this._db.has(data.id))
      throw new Error(`User with ID ${data.id} already exists`);
    this._db.set(data.id, data);
    return data.id;
  }

  public updateUser(id: UserId, updateData: Omit<User, "id">): boolean {
    if (!this._db.has(id))
      throw new Error(`User with ID ${id} does not exists`);

    this._db.set(id, { ...updateData, id });
    return true;
  }

  public getUserById(id: UserId): User {
    if (!this._db.has(id))
      throw new Error(`User with ID ${id} does not exists`);
    return this._db.get(id)!;
  }
}

const myDb = new InMemoryDB();

myDb.insertUser({
  id: "1",
  fname: "Swasti",
  email: "s@gmail.com",
  address: {
    street: 141,
    pin: 394221,
    country: "India",
  },
  contact: { mobile: "7041339725" },
});
